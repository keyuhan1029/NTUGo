'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import type { BusStop, BusRealTimeInfo } from '@/services/busApi';

interface BusInfoContentProps {
  selectedBusStop: BusStop | null;
  busRealTimeInfo: BusRealTimeInfo[];
  busRealTimeLoading: boolean;
  busError: string | null;
}

export default function BusInfoContent({
  selectedBusStop,
  busRealTimeInfo,
  busRealTimeLoading,
  busError,
}: BusInfoContentProps) {
  return (
    <Box>
      {busRealTimeLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 1 }}>
          <CircularProgress size={20} sx={{ color: '#0F4C75' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
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
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                borderLeft: '3px solid #2196f3',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                📍 {selectedBusStop.StopAddress}
              </Typography>
            </Box>
          )}
          
          {busRealTimeInfo.length > 0 ? (
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1.5,
                  color: '#0F4C75',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                即時到站資訊
              </Typography>
              {busRealTimeInfo.slice(0, 5).map((info, index) => {
                const estimateMinutes = info.EstimateTime 
                  ? Math.floor(info.EstimateTime / 60) 
                  : null;
                const statusText = 
                  info.StopStatus === 0 ? '即將進站' :
                  info.StopStatus === 1 ? '尚未發車' :
                  info.StopStatus === 2 ? '交管不停靠' :
                  info.StopStatus === 3 ? '末班車已過' :
                  info.StopStatus === 4 ? '今日未營運' : '未知';
                
                return (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 1.5, 
                      p: 1.5, 
                      bgcolor: 'rgba(33, 150, 243, 0.08)', 
                      borderRadius: 2,
                      borderLeft: '4px solid #2196f3',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.12)',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#1976d2' }}>
                      {info.RouteName.Zh_tw}
                      <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', ml: 0.5, color: 'text.secondary' }}>
                        {info.Direction === 0 ? '(去程)' : '(返程)'}
                      </Typography>
                    </Typography>
                    {estimateMinutes !== null && estimateMinutes >= 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        ⏱️ 預估 {estimateMinutes} 分鐘後到站
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {statusText}
                      </Typography>
                    )}
                    {info.PlateNumb && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                        車牌：{info.PlateNumb}
                      </Typography>
                    )}
                  </Box>
                );
              })}
              {busRealTimeInfo.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  還有 {busRealTimeInfo.length - 5} 班公車...
                </Typography>
              )}
            </Box>
          ) : !busRealTimeLoading && (
            <Typography variant="body2" color="text.secondary">
              目前無公車資訊
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

