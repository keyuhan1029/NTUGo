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
 * 獲取捷運首末班車時刻表
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
    const stationId = searchParams.get('stationId');
    const stationName = searchParams.get('stationName');

    if (!stationId && !stationName) {
      return NextResponse.json(
        { error: '缺少必要參數: stationId 或 stationName' },
        { status: 400 }
      );
    }

    const accessToken = await getTDXToken();

    // 使用 TDX API 獲取捷運首末班車時刻表
    // TRTC = 台北捷運
    // 優先使用 stationId，如果沒有則使用 stationName（精確匹配）
    let filterQuery = '';
    if (stationId) {
      // OData 語法：StationID eq '值'
      // 單引號在 URL 中需要編碼為 %27
      const filterValue = `StationID eq '${stationId}'`;
      filterQuery = `$filter=${encodeURIComponent(filterValue)}`;
    } else if (stationName) {
      // 使用站名精確查詢，移除"站"字後進行匹配
      // 注意：TDX API 中的站名可能不包含"站"字
      const cleanStationName = stationName.replace('站', '').trim();
      const filterValue = `StationName/Zh_tw eq '${cleanStationName}'`;
      filterQuery = `$filter=${encodeURIComponent(filterValue)}`;
    }

    // 不限制 $top，獲取該站所有方向的首末班車資料
    // 大安站等交界站可能有多個方向（4個方向），需要獲取所有資料
    const apiUrl = filterQuery 
      ? `https://tdx.transportdata.tw/api/basic/v2/Rail/Metro/FirstLastTimetable/TRTC?${filterQuery}&$format=JSON`
      : `https://tdx.transportdata.tw/api/basic/v2/Rail/Metro/FirstLastTimetable/TRTC?$format=JSON`;
    
    const response = await fetch(
      apiUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // 處理 429 錯誤（請求過於頻繁）
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API 請求過於頻繁', message: '請稍後再試', Timetable: [] },
          { status: 429 }
        );
      }
      
      const errorText = await response.text().catch(() => '');
      console.error('TDX API 錯誤響應:', response.status, errorText);
      throw new Error(`TDX API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    
    // 確保返回的是數組
    const timetable = Array.isArray(data) ? data : [];
    
    return NextResponse.json({ Timetable: timetable });
  } catch (error: any) {
    console.error('獲取捷運時刻表失敗:', error);
    return NextResponse.json(
      { error: '獲取捷運時刻表失敗', message: error.message },
      { status: 500 }
    );
  }
}

