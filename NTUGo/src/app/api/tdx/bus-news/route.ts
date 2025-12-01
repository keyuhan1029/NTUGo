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
 * 獲取公車新聞/公告資訊
 * 包含公車到站相關的公告、改道、停駛等資訊
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
    const city = searchParams.get('city') || 'Taipei'; // 預設台北市
    const top = searchParams.get('top') || '10'; // 預設取前 10 筆

    const accessToken = await getTDXToken();

    // 使用 TDX API 獲取公車新聞
    // CityBus News API
    const apiUrl = `https://tdx.transportdata.tw/api/basic/v2/Bus/News/City/${city}?$top=${top}&$format=JSON`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '無法讀取錯誤訊息');
      console.error('TDX API 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        errorText: errorText.substring(0, 500),
      });
      throw new Error(`TDX API 請求失敗: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ News: data });
  } catch (error: any) {
    console.error('獲取公車新聞失敗:', error);
    return NextResponse.json(
      { error: '獲取公車新聞失敗', message: error.message },
      { status: 500 }
    );
  }
}

