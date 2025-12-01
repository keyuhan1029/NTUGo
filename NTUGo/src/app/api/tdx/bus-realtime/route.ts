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

    return NextResponse.json({ BusRealTimeInfos: busData });
  } catch (error: any) {
    console.error('獲取公車即時資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取公車即時資訊失敗', message: error.message },
      { status: 500 }
    );
  }
}

