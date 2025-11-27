// 公車 API 服務層
// 使用 TDX (Transport Data eXchange) API

export interface BusStop {
  StopUID: string;        // 站牌唯一識別碼
  StopID: string;         // 站牌編號
  StopName: {
    Zh_tw: string;        // 中文站名
    En?: string;          // 英文站名
  };
  StopPosition: {
    PositionLat: number;  // 緯度
    PositionLon: number;  // 經度
  };
  StopAddress?: string;   // 站牌地址
  City?: string;          // 城市
}

export interface BusRoute {
  RouteUID: string;       // 路線唯一識別碼
  RouteID: string;        // 路線編號
  RouteName: {
    Zh_tw: string;        // 中文路線名
    En?: string;          // 英文路線名
  };
  Direction: number;      // 去返程 (0: 去程, 1: 返程)
}

export interface BusRealTimeInfo {
  StopUID: string;        // 站牌唯一識別碼
  StopID: string;         // 站牌編號
  StopName: {
    Zh_tw: string;        // 中文站名
    En?: string;          // 英文站名
  };
  RouteUID: string;       // 路線唯一識別碼
  RouteID: string;        // 路線編號
  RouteName: {
    Zh_tw: string;        // 中文路線名
    En?: string;          // 英文路線名
  };
  Direction: number;      // 去返程
  EstimateTime?: number;  // 預估到站時間（秒）
  StopStatus: number;      // 站牌狀態 (0: 正常, 1: 尚未發車, 2: 交管不停靠, 3: 末班車已過, 4: 今日未營運)
  StopSequence: number;    // 路線經過站牌之順序
  NextBusTime?: string;    // 下次到站時間
  PlateNumb?: string;      // 車牌號碼
}

// 快取資料
let cachedBusStops: BusStop[] | null = null;
let cachedRealTimeInfo: Map<string, BusRealTimeInfo[]> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 快取 30 秒（公車資料更新較頻繁）

/**
 * 獲取台大周邊的公車站牌資訊
 * 注意：TDX API 需要 API Key，如果未設定則會返回空陣列
 */
export async function fetchBusStopsNearNTU(): Promise<BusStop[]> {
  // 檢查快取
  const now = Date.now();
  if (cachedBusStops && (now - cacheTimestamp) < CACHE_DURATION * 2) {
    return cachedBusStops;
  }

  try {
    // 台大中心座標和周邊範圍
    const centerLat = 25.0173405;
    const centerLon = 121.5397518;
    const radius = 1000; // 1 公里範圍

    // 使用 Next.js API route 來避免 CORS 問題和處理認證
    const response = await fetch(
      `/api/tdx/bus-stops?lat=${centerLat}&lon=${centerLon}&radius=${radius}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 如果沒有設定 API Key，返回空陣列而不是拋出錯誤
      if (response.status === 500 && errorData.error === 'TDX API Key 未設定') {
        console.warn('TDX API Key 未設定，無法載入公車站牌資料');
        return [];
      }
      
      throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const stops: BusStop[] = data.Stops || [];

    cachedBusStops = stops;
    cacheTimestamp = now;

    console.log(`成功載入 ${stops.length} 個公車站牌`);

    return stops;
  } catch (error) {
    console.error('獲取公車站牌資料失敗:', error);
    if (cachedBusStops) {
      return cachedBusStops;
    }
    // 發生錯誤時返回空陣列，而不是拋出錯誤
    return [];
  }
}

/**
 * 獲取特定站牌的即時公車資訊
 * 注意：TDX API 需要 API Key，如果未設定則會返回空陣列
 */
export async function fetchBusRealTimeInfo(stopUID: string): Promise<BusRealTimeInfo[]> {
  // 檢查快取
  const cacheKey = stopUID;
  const now = Date.now();
  const cached = cachedRealTimeInfo.get(cacheKey);
  if (cached && (now - cacheTimestamp) < CACHE_DURATION) {
    return cached;
  }

  try {
    // 使用 Next.js API route 來避免 CORS 問題和處理認證
    const response = await fetch(`/api/tdx/bus-realtime?stopUID=${stopUID}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 如果沒有設定 API Key，返回空陣列而不是拋出錯誤
      if (response.status === 500 && errorData.error === 'TDX API Key 未設定') {
        console.warn('TDX API Key 未設定，無法載入公車即時資訊');
        return [];
      }
      
      throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const realTimeInfo: BusRealTimeInfo[] = data.BusRealTimeInfos || [];

    cachedRealTimeInfo.set(cacheKey, realTimeInfo);
    cacheTimestamp = now;

    return realTimeInfo;
  } catch (error) {
    console.error('獲取公車即時資訊失敗:', error);
    const cached = cachedRealTimeInfo.get(cacheKey);
    if (cached) {
      return cached;
    }
    // 發生錯誤時返回空陣列，而不是拋出錯誤
    return [];
  }
}

/**
 * 根據座標查找附近的公車站牌
 */
export function findBusStopsByLocation(
  stops: BusStop[],
  lat: number,
  lon: number,
  maxDistance: number = 0.01
): BusStop[] {
  return stops.filter((stop) => {
    const distance = Math.sqrt(
      Math.pow(stop.StopPosition.PositionLat - lat, 2) +
      Math.pow(stop.StopPosition.PositionLon - lon, 2)
    );
    return distance <= maxDistance;
  });
}

/**
 * 清除快取
 */
export function clearBusCache(): void {
  cachedBusStops = null;
  cachedRealTimeInfo.clear();
  cacheTimestamp = 0;
}

