import { NextRequest, NextResponse } from 'next/server';

// TDX API 認證資訊
const TDX_CLIENT_ID = process.env.TDX_CLIENT_ID || '';
const TDX_CLIENT_SECRET = process.env.TDX_CLIENT_SECRET || '';

/**
 * 獲取 TDX API Access Token
 */
async function getTDXToken(): Promise<string> {
  const response = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: TDX_CLIENT_ID,
      client_secret: TDX_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`TDX 認證失敗: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 獲取公車即時資訊
 * 直接按站牌查詢所有經過該站牌的路線（每條路線顯示最近一班車的到站時間）
 * 使用 EstimatedTimeOfArrival API，會返回所有經過該站牌且有實時數據的路線
 */
export async function GET(request: NextRequest) {
  try {
    if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'TDX API Key 未設定' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const stopUID = searchParams.get('stopUID');

    if (!stopUID) {
      return NextResponse.json(
        { error: '缺少必要參數: stopUID' },
        { status: 400 }
      );
    }

    const accessToken = await getTDXToken();

    // 直接按站牌查詢所有經過該站牌的路線
    // EstimatedTimeOfArrival API 會返回所有經過該站牌且有實時數據的路線
    const response = await fetch(
      `https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopUID eq '${stopUID}'&$format=JSON`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    // 處理 429 錯誤（請求過於頻繁）
    if (response.status === 429) {
      console.warn('TDX API 請求過於頻繁，請稍後再試');
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試', message: 'TDX API 429' },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`TDX API 請求失敗: ${response.status}`, errorText);
      throw new Error(`TDX API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const busData = Array.isArray(data) ? data : [];

    // 調試：查看返回的數據結構
    console.log(`[API] EstimatedTimeOfArrival 返回 ${busData.length} 筆資料`);
    
    if (busData.length > 0) {
      console.log(`[API] 第一筆資料範例:`, JSON.stringify(busData[0], null, 2));
      
      // 檢查路線統計
      const routeCounts = new Map<string, number>();
      const routesWithTime = new Set<string>();
      busData.forEach((bus) => {
        const routeKey = `${bus.RouteUID || bus.RouteID}-${bus.Direction || 0}`;
        routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1);
        
        // 檢查是否有 EstimateTime（可能為 undefined）
        const hasEstimateTime = bus.EstimateTime !== null && 
                               bus.EstimateTime !== undefined && 
                               typeof bus.EstimateTime === 'number' &&
                               bus.EstimateTime >= 0;
        if (hasEstimateTime) {
          routesWithTime.add(routeKey);
        }
      });
      
      console.log(`[API] 路線統計（共 ${routeCounts.size} 條不同路線）:`, Array.from(routeCounts.entries()));
      console.log(`[API] 有到站時間的路線: ${routesWithTime.size} 條`);
      console.log(`[API] 無到站時間的路線（末班車已過等）: ${routeCounts.size - routesWithTime.size} 條`);
      
      // 顯示每條路線的名稱和狀態
      const uniqueRoutes = new Map<string, { name: string; hasTime: boolean; status: number }>();
      busData.forEach((bus) => {
        const routeKey = `${bus.RouteUID || bus.RouteID}-${bus.Direction || 0}`;
        if (!uniqueRoutes.has(routeKey)) {
          const hasEstimateTime = bus.EstimateTime !== null && 
                                 bus.EstimateTime !== undefined && 
                                 typeof bus.EstimateTime === 'number' &&
                                 bus.EstimateTime >= 0;
          uniqueRoutes.set(routeKey, {
            name: bus.RouteName?.Zh_tw || '未知路線',
            hasTime: hasEstimateTime,
            status: bus.StopStatus ?? -1
          });
        }
      });
      console.log(`[API] 路線列表:`, Array.from(uniqueRoutes.entries()).map(([key, info]) => {
        const bus = busData.find(b => `${b.RouteUID || b.RouteID}-${b.Direction || 0}` === key);
        const timeText = info.hasTime && bus?.EstimateTime 
          ? `預估 ${Math.floor(bus.EstimateTime / 60)} 分鐘` 
          : info.status === 3 ? '末班車已過' 
          : info.status === 4 ? '今日未營運' 
          : '狀態未知';
        return `${info.name} (${key}) - ${timeText}`;
      }));
    } else {
      console.log(`[API] 站牌 ${stopUID} 目前沒有任何路線有實時數據`);
    }

    return NextResponse.json({ BusRealTimeInfos: busData });
  } catch (error: any) {
    console.error('獲取公車即時資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取公車即時資訊失敗', message: error.message },
      { status: 500 }
    );
  }
}

