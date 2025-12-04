'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

interface GymOccupancy {
  fitnessCenter: { current: number; optimal: number; max: number };
  swimmingPool: { current: number; optimal: number; max: number };
  status: string;
  totalCurrent: number;
  totalMax: number;
  lastUpdated: string;
}

interface GymInfoContentProps {
  gymOccupancy: GymOccupancy | null;
  gymLoading: boolean;
  gymError: string | null;
}

export default function GymInfoContent({
  gymOccupancy,
  gymLoading,
  gymError,
}: GymInfoContentProps) {
  const handleTicketClick = () => {
    // 跳轉到會員專區頁面
    window.open('https://rent.pe.ntu.edu.tw/member/', '_blank');
  };

  return (
    <Box>
      {gymLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 2 }}>
          <CircularProgress size={20} sx={{ color: '#0F4C75' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            載入中...
          </Typography>
        </Box>
      )}
      
      {gymError && !gymLoading && !gymOccupancy && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {gymError}
        </Alert>
      )}
      
      {gymOccupancy && (
        <Box>
          {/* 總人數狀態卡片 */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: gymOccupancy.status === '擁擠' 
                ? '#ffebee' 
                : gymOccupancy.status === '較多'
                ? '#fff3e0'
                : '#e8f5e9',
              borderRadius: 2,
              border: `2px solid ${
                gymOccupancy.status === '擁擠' 
                  ? '#f44336' 
                  : gymOccupancy.status === '較多'
                  ? '#ff9800'
                  : '#4caf50'
              }`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
              總人數狀態
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {gymOccupancy.status}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {gymOccupancy.totalCurrent} / {gymOccupancy.totalMax} 人
            </Typography>
          </Box>
          
          {/* 健身中心資訊卡片 */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: '#fff5f5',
              borderRadius: 2,
              borderLeft: '4px solid #f44336',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#d32f2f' }}>
              健身中心
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                現在人數
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.fitnessCenter.current} 人
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                最適人數
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.fitnessCenter.optimal} 人
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                最大容量
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.fitnessCenter.max} 人
              </Typography>
            </Box>
          </Box>
          
          {/* 室內游泳池資訊卡片 */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: '#e3f2fd',
              borderRadius: 2,
              borderLeft: '4px solid #2196f3',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
              室內游泳池
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                現在人數
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.swimmingPool.current} 人
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                最適人數
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.swimmingPool.optimal} 人
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                最大容量
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {gymOccupancy.swimmingPool.max} 人
              </Typography>
            </Box>
          </Box>
          
          {gymOccupancy.lastUpdated && (
            <Box
              sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: '1px solid #e0e0e0',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                🕐 最後更新: {gymOccupancy.lastUpdated}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* 按鈕區域 */}
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleTicketClick}
          sx={{
            backgroundColor: '#0F4C75',
            color: '#ffffff',
            fontWeight: 600,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#0d3d5f',
            },
          }}
        >
          回數票
        </Button>
      </Box>
    </Box>
  );
}

