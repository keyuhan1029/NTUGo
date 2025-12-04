// YouBike API 服務層
// 使用台北市政府開放資料平台 API

export interface YouBikeStation {
  sno: string;      // 站點編號
  sna: string;      // 站點名稱
  tot: number;      // 總停車格數
  sbi: number;      // 可借車輛數
  bemp: number;     // 可還車位數
  lat: number;      // 緯度
  lng: number;      // 經度
  act: string;      // 站點狀態 (1: 正常, 0: 暫停服務)
  ar?: string;      // 地址
  sarea?: string;   // 行政區
  mday?: string;    // 資料更新時間
}

interface YouBikeApiResponse {
  success: boolean;
  result: {
    results: YouBikeStation[];
  };
}

// 快取資料（避免頻繁請求）
let cachedStations: YouBikeStation[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 快取 60 秒

/**
 * 獲取所有 YouBike 站點資料
 * 使用快取機制避免頻繁請求
 */
export async function fetchYouBikeStations(): Promise<YouBikeStation[]> {
  // 檢查快取是否有效
  const now = Date.now();
  if (cachedStations && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedStations;
  }

  try {
    // 台北市政府 YouBike 2.0 即時資料 API
    // 使用新的 v2 API，提供更完整的站點資料
    const response = await fetch(
      'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    
    // 解析 API 回應格式
    // 新 API 返回格式為陣列：[{站點資料}, ...]
    const stations: YouBikeStation[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((station) => {
        // 處理座標：確保為有效數字
        const lat = parseFloat(String(station.latitude || station.lat || '0').trim());
        const lng = parseFloat(String(station.longitude || station.lng || '0').trim());
        
        // 只添加有效座標的站點
        if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
          stations.push({
            sno: station.sno || '',
            sna: station.sna || '',
            tot: parseInt(station.Quantity || station.tot || '0', 10),
            sbi: parseInt(station.available_rent_bikes || station.sbi || '0', 10),
            bemp: parseInt(station.available_return_bikes || station.bemp || '0', 10),
            lat: lat,
            lng: lng,
            act: station.act || '0',
            ar: station.ar || '',
            sarea: station.sarea || '',
            mday: station.mday || station.updateTime || '',
          });
        }
      });
    }

    // 更新快取
    cachedStations = stations;
    cacheTimestamp = now;

    return stations;
  } catch (error) {
    console.error('獲取 YouBike 資料失敗:', error);
    
    // 如果快取存在，返回快取資料
    if (cachedStations) {
      return cachedStations;
    }
    
    throw error;
  }
}

/**
 * 根據站點名稱查找站點
 */
export function findStationByName(
  stations: YouBikeStation[],
  name: string
): YouBikeStation | null {
  return (
    stations.find(
      (station) =>
        station.sna.includes(name) || name.includes(station.sna)
    ) || null
  );
}

/**
 * 根據座標查找最近的站點
 */
export function findStationByLocation(
  stations: YouBikeStation[],
  lat: number,
  lng: number,
  maxDistance: number = 0.01 // 預設最大距離約 1 公里
): YouBikeStation | null {
  let nearestStation: YouBikeStation | null = null;
  let minDistance = Infinity;

  stations.forEach((station) => {
    const distance = Math.sqrt(
      Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lng, 2)
    );

    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  });

  return nearestStation;
}

/**
 * 清除快取
 */
export function clearCache(): void {
  cachedStations = null;
  cacheTimestamp = 0;
}

