import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('請在環境變數中設定 MONGODB_URI');
}

let uri = process.env.MONGODB_URI || '';

// 確保連接字符串格式正確
if (!uri) {
  throw new Error('MONGODB_URI 環境變數未設定');
}

// 自動修復連接字符串（確保包含必要的參數）
if (uri.includes('mongodb+srv://')) {
  // 分離基礎 URI 和查詢參數
  const [baseUri, existingParams] = uri.split('?');
  
  // 檢查是否有數據庫名稱
  // 格式應該是: mongodb+srv://user:pass@host/dbname
  const parts = baseUri.split('/');
  const hasDbName = parts.length > 3 && parts[3] && parts[3].trim() !== '';
  
  // 如果沒有數據庫名稱，添加默認數據庫 'ntugo'
  let fixedBaseUri = baseUri;
  if (!hasDbName) {
    fixedBaseUri = baseUri.endsWith('/') ? baseUri + 'ntugo' : baseUri + '/ntugo';
  }
  
  // 構建查詢參數
  const params = new URLSearchParams(existingParams || '');
  
  // 確保包含必要的參數
  if (!params.has('retryWrites')) {
    params.set('retryWrites', 'true');
  }
  if (!params.has('w')) {
    params.set('w', 'majority');
  }
  
  // 重新組合 URI
  const queryString = params.toString();
  uri = queryString ? `${fixedBaseUri}?${queryString}` : fixedBaseUri;
}

// 輸出修復後的連接字符串（用於調試，生產環境應移除）
if (process.env.NODE_ENV === 'development') {
  console.log('MongoDB 連接字符串:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
}

// MongoDB 連接選項
// MongoDB 6.x 版本與 Node.js 20.14.0 兼容
const options: any = {
  maxPoolSize: 10, // 最大連線池大小
  minPoolSize: 1, // 最小連線池大小
  serverSelectionTimeoutMS: 30000, // 服務器選擇超時時間
  socketTimeoutMS: 45000, // Socket 超時時間
  connectTimeoutMS: 30000, // 連線超時時間
  // MongoDB Atlas SRV 連接自動使用 TLS
  // 嘗試禁用 TLS 驗證（僅用於測試）
  // 注意：這會降低安全性，僅用於診斷
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 初始化連接函數
function initMongoClient(): Promise<MongoClient> {
  const mongoClient = new MongoClient(uri, options);
  return mongoClient.connect().catch((err: any) => {
    console.error('MongoDB 連線錯誤:', err);
    console.error('錯誤詳情:', {
      name: err.name,
      message: err.message,
      code: err.code,
      cause: err.cause?.code || err.cause?.message,
    });
    
    // 如果是 SSL/TLS 錯誤，提供建議
    if (err.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' || err.message?.includes('SSL')) {
      console.error(`
⚠️  SSL/TLS 連接錯誤！請檢查：
1. MongoDB Atlas Network Access 設置是否允許您的 IP
2. 連接字符串格式是否正確
3. Node.js 版本是否兼容（當前: ${process.version}）
4. 運行測試腳本: node scripts/test-mongodb-connection.js
      `);
    }
    throw err;
  });
}

if (process.env.NODE_ENV === 'development') {
  // 在開發模式下，使用全域變數以避免多個連線
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = initMongoClient();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 在生產模式下，每次都創建新的連線
  clientPromise = initMongoClient();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export default clientPromise;

