/**
 * MongoDB 連接測試腳本
 * 運行: node scripts/test-mongodb-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI 環境變數未設定');
  console.log('請在 .env.local 中設定 MONGODB_URI');
  process.exit(1);
}

console.log('🔍 測試 MongoDB 連接...');
console.log('連接字符串:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('');

// 修復連接字符串
let fixedUri = uri;
if (uri.includes('mongodb+srv://')) {
  const [baseUri, existingParams] = uri.split('?');
  const parts = baseUri.split('/');
  const hasDbName = parts.length > 3 && parts[3] && parts[3].trim() !== '';
  
  if (!hasDbName) {
    fixedUri = baseUri.endsWith('/') ? baseUri + 'ntugo' : baseUri + '/ntugo';
  }
  
  const params = new URLSearchParams(existingParams || '');
  if (!params.has('retryWrites')) {
    params.set('retryWrites', 'true');
  }
  if (!params.has('w')) {
    params.set('w', 'majority');
  }
  
  const queryString = params.toString();
  fixedUri = queryString ? `${fixedUri}?${queryString}` : fixedUri;
}

console.log('修復後的連接字符串:', fixedUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
console.log('');

const client = new MongoClient(fixedUri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

async function testConnection() {
  try {
    console.log('⏳ 嘗試連接...');
    await client.connect();
    console.log('✅ MongoDB 連接成功！');
    
    // 測試基本操作
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📁 數據庫中的集合:', collections.map(c => c.name).join(', ') || '(無)');
    
    // 測試 users 集合
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👤 用戶數量:', userCount);
    
    await client.close();
    console.log('✅ 連接已關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:');
    console.error('錯誤名稱:', error.name);
    console.error('錯誤訊息:', error.message);
    console.error('錯誤代碼:', error.code);
    
    if (error.cause) {
      console.error('根本原因:', error.cause.code || error.cause.message);
    }
    
    console.error('');
    console.error('💡 可能的解決方案:');
    console.error('1. 檢查 MongoDB Atlas Network Access 設置');
    console.error('   - 訪問 https://cloud.mongodb.com/ → Network Access');
    console.error('   - 添加您的 IP 地址或允許所有 IP (0.0.0.0/0)');
    console.error('');
    console.error('2. 檢查連接字符串是否正確');
    console.error('   - 確認用戶名和密碼正確');
    console.error('   - 如果密碼包含特殊字符，需要 URL 編碼');
    console.error('');
    console.error('3. 重新生成連接字符串');
    console.error('   - MongoDB Atlas → Database → Connect → Drivers');
    console.error('   - 選擇 Node.js 並複製連接字符串');
    
    process.exit(1);
  }
}

testConnection();


