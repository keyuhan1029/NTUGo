'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { NTU_CENTER, LOCATIONS } from '@/data/mockData';
import {
  fetchYouBikeStations,
  findStationByName,
  findStationByLocation,
  type YouBikeStation,
} from '@/services/youbikeApi';
import {
  fetchBusStopsNearNTU,
  fetchBusRealTimeInfo,
  type BusStop,
  type BusRealTimeInfo,
} from '@/services/busApi';
import { useMapContext } from '@/contexts/MapContext';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Google Maps Styling: 
// 1. 全地圖灰階
// 2. 隱藏所有 POI (包括建築物) 在全地圖
// 3. 隱藏 Google 原生的 clickable POI pins
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false, // Disable Google native POI pins
  styles: [
    // 1. 全地圖灰階基礎
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [{ saturation: -100 }],
    },
    // 2. 隱藏所有 POI 標籤
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // 3. 隱藏所有 POI 建築物 (全域隱藏，之後用 Polygon 在台大範圍內顯示)
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    // 4. 隱藏 landscape.man_made (人造建築)
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    // 5. 道路保持可見
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }, { lightness: 50 }],
    },
    // 6. 水域淡灰色
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
    // 7. 保留公車站 (transit.station.bus)
    {
      featureType: 'transit.station.bus',
      elementType: 'all',
      stylers: [{ visibility: 'on' }],
    },
    // 8. 隱藏其他 transit 標籤 (捷運等)
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
  tilt: 45,
};

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const { showYouBikeStations, showBusStops } = useMapContext();
  const [selectedMarker, setSelectedMarker] = React.useState<any>(null);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [youbikeStations, setYoubikeStations] = React.useState<YouBikeStation[]>([]);
  const [youbikeLoading, setYoubikeLoading] = React.useState<boolean>(false);
  const [youbikeError, setYoubikeError] = React.useState<string | null>(null);
  const [selectedYouBikeStation, setSelectedYouBikeStation] = React.useState<YouBikeStation | null>(null);
  const [visibleYouBikeStations, setVisibleYouBikeStations] = React.useState<YouBikeStation[]>([]);
  
  // 公車相關 state
  const [busStops, setBusStops] = React.useState<BusStop[]>([]);
  const [busLoading, setBusLoading] = React.useState<boolean>(false);
  const [busError, setBusError] = React.useState<string | null>(null);
  const [visibleBusStops, setVisibleBusStops] = React.useState<BusStop[]>([]);
  const [selectedBusStop, setSelectedBusStop] = React.useState<BusStop | null>(null);
  const [busRealTimeInfo, setBusRealTimeInfo] = React.useState<BusRealTimeInfo[]>([]);
  const [busRealTimeLoading, setBusRealTimeLoading] = React.useState<boolean>(false);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  // 載入 YouBike 站點資料
  React.useEffect(() => {
    const loadYouBikeStations = async () => {
      try {
        setYoubikeLoading(true);
        setYoubikeError(null);
        const stations = await fetchYouBikeStations();
        setYoubikeStations(stations);
      } catch (error) {
        console.error('載入 YouBike 資料失敗:', error);
        setYoubikeError('無法載入 YouBike 站點資料');
      } finally {
        setYoubikeLoading(false);
      }
    };

    if (isLoaded) {
      loadYouBikeStations();
    }
  }, [isLoaded]);

  // 載入公車站牌資料
  React.useEffect(() => {
    const loadBusStops = async () => {
      if (!showBusStops) {
        setBusStops([]);
        setVisibleBusStops([]);
        return;
      }

      try {
        setBusLoading(true);
        setBusError(null);
        const stops = await fetchBusStopsNearNTU();
        setBusStops(stops);
      } catch (error) {
        console.error('載入公車站牌資料失敗:', error);
        setBusError('無法載入公車站牌資料');
      } finally {
        setBusLoading(false);
      }
    };

    if (isLoaded && showBusStops) {
      loadBusStops();
    }
  }, [isLoaded, showBusStops]);

  // 當 showYouBikeStations 或地圖範圍變化時，更新可見站點
  React.useEffect(() => {
    if (!map) return;

    const updateVisibleStations = () => {
      if (showYouBikeStations && youbikeStations.length > 0) {
        const bounds = map.getBounds();
        if (bounds) {
          const visible = youbikeStations.filter((station) => {
            const latLng = new google.maps.LatLng(station.lat, station.lng);
            return bounds.contains(latLng);
          });
          setVisibleYouBikeStations(visible);
        }
      } else {
        setVisibleYouBikeStations([]);
      }

      // 更新可見的公車站牌
      if (showBusStops && busStops.length > 0) {
        const bounds = map.getBounds();
        if (bounds) {
          const visible = busStops.filter((stop) => {
            const latLng = new google.maps.LatLng(
              stop.StopPosition.PositionLat,
              stop.StopPosition.PositionLon
            );
            return bounds.contains(latLng);
          });
          setVisibleBusStops(visible);
        }
      } else {
        setVisibleBusStops([]);
      }
    };

    // 初始更新
    updateVisibleStations();

    // 監聽地圖範圍變化
    const boundsListener = map.addListener('bounds_changed', updateVisibleStations);
    const zoomListener = map.addListener('zoom_changed', updateVisibleStations);
    const centerListener = map.addListener('center_changed', updateVisibleStations);

    // 清理監聽器
    return () => {
      google.maps.event.removeListener(boundsListener);
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(centerListener);
    };
  }, [map, showYouBikeStations, youbikeStations, showBusStops, busStops]);

  // 處理公車站牌點擊事件
  const handleBusStopClick = React.useCallback(async (stop: BusStop) => {
    setSelectedMarker({
      id: stop.StopUID,
      name: stop.StopName.Zh_tw,
      lat: stop.StopPosition.PositionLat,
      lng: stop.StopPosition.PositionLon,
      type: 'bus',
    });
    setSelectedBusStop(stop);
    setBusRealTimeInfo([]);

    // 獲取即時公車資訊
    try {
      setBusRealTimeLoading(true);
      const realTimeInfo = await fetchBusRealTimeInfo(stop.StopUID);
      setBusRealTimeInfo(realTimeInfo);
    } catch (error) {
      console.error('獲取公車即時資訊失敗:', error);
    } finally {
      setBusRealTimeLoading(false);
    }
  }, []);

  // 處理 bike pin 點擊事件
  const handleBikePinClick = React.useCallback(async (item: any) => {
    setSelectedMarker(item);
    setSelectedYouBikeStation(null);

    // 如果已經有載入的站點資料，直接查找
    if (youbikeStations.length > 0) {
      // 先嘗試根據名稱匹配
      let station = findStationByName(youbikeStations, item.name);
      
      // 如果名稱匹配失敗，嘗試根據座標匹配
      if (!station) {
        station = findStationByLocation(youbikeStations, item.lat, item.lng, 0.01);
      }

      if (station) {
        setSelectedYouBikeStation(station);
      }
    } else {
      // 如果還沒有載入資料，嘗試獲取
      try {
        setYoubikeLoading(true);
        const stations = await fetchYouBikeStations();
        setYoubikeStations(stations);
        
        let station = findStationByName(stations, item.name);
        if (!station) {
          station = findStationByLocation(stations, item.lat, item.lng, 0.01);
        }

        if (station) {
          setSelectedYouBikeStation(station);
        }
      } catch (error) {
        console.error('獲取 YouBike 資料失敗:', error);
        setYoubikeError('無法獲取站點資訊');
      } finally {
        setYoubikeLoading(false);
      }
    }
  }, [youbikeStations]);

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={NTU_CENTER}
      zoom={16}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Food Pins */}
      {LOCATIONS.food.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#ff9800',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 1.5,
          }}
        />
      ))}

      {/* 公車站牌標記 (從 API 獲取，顯示在地圖範圍內) - 只有點擊左側公車圖示時才顯示 */}
      {showBusStops &&
        visibleBusStops.map((stop) => (
          <MarkerF
            key={`bus-${stop.StopUID}`}
            position={{
              lat: stop.StopPosition.PositionLat,
              lng: stop.StopPosition.PositionLon,
            }}
            onClick={() => handleBusStopClick(stop)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#2196f3',
              fillOpacity: 0.8,
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
          />
        ))}

      {/* Bike Pins (模擬資料) */}
      {LOCATIONS.bike.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => handleBikePinClick(item)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#fdd835',
            fillOpacity: 1,
            scale: 8,
            strokeWeight: 1,
            strokeColor: '#000000',
          }}
        />
      ))}

      {/* YouBike 站點標記 (從 API 獲取，顯示在地圖範圍內) */}
      {showYouBikeStations &&
        visibleYouBikeStations.map((station) => (
          <MarkerF
            key={`youbike-${station.sno}`}
            position={{ lat: station.lat, lng: station.lng }}
            onClick={() => {
              setSelectedMarker({
                id: `youbike-${station.sno}`,
                name: station.sna,
                lat: station.lat,
                lng: station.lng,
                type: 'bike',
              });
              setSelectedYouBikeStation(station);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: station.act === '1' ? '#fdd835' : '#999999', // 正常服務為黃色，暫停服務為灰色
              fillOpacity: 0.8,
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#000000',
            }}
          />
        ))}

      {/* Metro Pins */}
      {LOCATIONS.metro.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4caf50',
            fillOpacity: 1,
            scale: 10,
            strokeWeight: 1,
            strokeColor: '#ffffff',
          }}
        />
      ))}

      {/* Campus Pins */}
      {LOCATIONS.campus.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
            fillColor: '#9c27b0',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 1.5,
          }}
        />
      ))}

      {selectedMarker && (
        <InfoWindowF
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => {
            setSelectedMarker(null);
            setSelectedYouBikeStation(null);
            setSelectedBusStop(null);
            setBusRealTimeInfo([]);
          }}
        >
          <Box sx={{ p: 1, minWidth: 250, maxWidth: 350 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {selectedMarker.name}
            </Typography>
            
            {selectedMarker.type === 'bus' && (
              <Box>
                {busRealTimeLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      載入中...
                    </Typography>
                  </Box>
                )}
                
                {busError && !busRealTimeInfo.length && (
                  <Alert severity="info" sx={{ mb: 1, fontSize: '0.75rem', py: 0.5 }}>
                    {busError.includes('API Key') ? (
                      <>
                        需要設定 TDX API Key 才能顯示公車資訊
                        <br />
                        <Typography variant="caption" component="span">
                          請在 .env.local 中設定 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET
                        </Typography>
                      </>
                    ) : (
                      busError
                    )}
                  </Alert>
                )}
                
                {selectedBusStop && (
                  <Box>
                    {selectedBusStop.StopAddress && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {selectedBusStop.StopAddress}
                      </Typography>
                    )}
                    
                    {busRealTimeInfo.length > 0 ? (
                      <Box>
                        {(() => {
                          // 按路線分組（RouteUID + Direction）
                          const groupedByRoute = new Map<string, BusRealTimeInfo[]>();
                          busRealTimeInfo.forEach((info) => {
                            const routeKey = `${info.RouteUID}-${info.Direction}`;
                            if (!groupedByRoute.has(routeKey)) {
                              groupedByRoute.set(routeKey, []);
                            }
                            groupedByRoute.get(routeKey)!.push(info);
                          });

                          // 將每條路線的班次按到站時間排序
                          const sortedRoutes = Array.from(groupedByRoute.entries()).map(([routeKey, buses]) => {
                            const sortedBuses = [...buses].sort((a, b) => {
                              const timeA = a.EstimateTime ?? Infinity;
                              const timeB = b.EstimateTime ?? Infinity;
                              return timeA - timeB;
                            });
                            return {
                              routeKey,
                              routeName: buses[0].RouteName.Zh_tw,
                              direction: buses[0].Direction,
                              buses: sortedBuses,
                            };
                          });

                          // 按第一班車的到站時間排序路線
                          sortedRoutes.sort((a, b) => {
                            const timeA = a.buses[0]?.EstimateTime ?? Infinity;
                            const timeB = b.buses[0]?.EstimateTime ?? Infinity;
                            return timeA - timeB;
                          });

                          return sortedRoutes.map((route) => {
                            const firstBus = route.buses[0];
                            const estimateMinutes = firstBus.EstimateTime 
                              ? Math.floor(firstBus.EstimateTime / 60) 
                              : null;
                            
                            const statusText = 
                              firstBus.StopStatus === 0 ? '即將進站' :
                              firstBus.StopStatus === 1 ? '尚未發車' :
                              firstBus.StopStatus === 2 ? '交管不停靠' :
                              firstBus.StopStatus === 3 ? '末班駛離' :
                              firstBus.StopStatus === 4 ? '今日停駛' : '未知';
                            
                            return (
                              <Box
                                key={route.routeKey}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  py: 1.25,
                                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                                  '&:last-child': {
                                    borderBottom: 'none'
                                  }
                                }}
                              >
                                {/* 左側時間/狀態標籤 */}
                                <Box
                                  sx={{
                                    minWidth: 70,
                                    height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: estimateMinutes !== null && estimateMinutes >= 0 
                                      ? '#8B4513'  // 深棕色（有時間）
                                      : '#9E9E9E', // 灰色（無時間）
                                    color: '#ffffff',
                                    borderRadius: 0.5,
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    mr: 1.5,
                                    px: 1
                                  }}
                                >
                                  {estimateMinutes !== null && estimateMinutes >= 0 
                                    ? `${estimateMinutes}分`
                                    : statusText
                                  }
                                </Box>

                                {/* 中間路線資訊 */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: '0.9rem',
                                      fontWeight: 400,
                                      color: '#000000',
                                      lineHeight: 1.4
                                    }}
                                  >
                                    {route.routeName} {route.direction === 0 ? '- 去程' : '- 返程'}
                                  </Typography>
                                </Box>

                                {/* 右側車牌號碼（如果有） */}
                                {firstBus.PlateNumb && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.7rem',
                                      color: 'rgba(0, 0, 0, 0.5)',
                                      ml: 1
                                    }}
                                  >
                                    {firstBus.PlateNumb}
                                  </Typography>
                                )}
                              </Box>
                            );
                          });
                        })()}
                      </Box>
                    ) : !busRealTimeLoading && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          textAlign: 'center',
                          py: 2,
                          fontSize: '0.875rem'
                        }}
                      >
                        目前無公車資訊
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
            
            {selectedMarker.type === 'bike' && (
              <Box>
                {youbikeLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      載入中...
                    </Typography>
                  </Box>
                )}
                
                {youbikeError && !selectedYouBikeStation && (
                  <Alert severity="warning" sx={{ mb: 1, fontSize: '0.75rem', py: 0.5 }}>
                    {youbikeError}
                  </Alert>
                )}
                
                {selectedYouBikeStation ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>可借車輛：</strong>{selectedYouBikeStation.sbi} 輛
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>可還車位：</strong>{selectedYouBikeStation.bemp} 個
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>總停車格：</strong>{selectedYouBikeStation.tot} 個
                    </Typography>
                    {selectedYouBikeStation.act === '1' ? (
                      <Typography variant="body2" color="success.main" sx={{ fontSize: '0.75rem' }}>
                        ✓ 正常服務中
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="error.main" sx={{ fontSize: '0.75rem' }}>
                        ⚠ 暫停服務
                      </Typography>
                    )}
                    {selectedYouBikeStation.ar && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {selectedYouBikeStation.ar}
                      </Typography>
                    )}
                  </Box>
                ) : !youbikeLoading && !youbikeError && (
                  <Typography variant="body2" color="text.secondary">
                    找不到對應的站點資訊
                  </Typography>
                )}
              </Box>
            )}
            
            {selectedMarker.type === 'food' && (
              <Typography variant="body2" color="text.secondary">
                美食評分: 4.5 ★
              </Typography>
            )}
            
            
            {selectedMarker.type === 'metro' && (
              <Typography variant="body2" color="text.secondary">
                往象山: 3分, 往淡水: 5分
              </Typography>
            )}
            
            {selectedMarker.type === 'library' && (
              <Typography variant="body2" color="text.secondary">
                閉館: 22:00, 人數: 適中
              </Typography>
            )}
            
            {selectedMarker.type === 'gym' && (
              <Typography variant="body2" color="text.secondary">
                人數: 擁擠 (80/100)
              </Typography>
            )}
          </Box>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
