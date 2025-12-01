'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

interface InfoWindowHeaderProps {
  name: string;
  type?: string;
  onClose: () => void;
}

export default function InfoWindowHeader({ name, type, onClose }: InfoWindowHeaderProps) {
  return (
    <Box
      sx={{
        backgroundColor: '#0F4C75',
        color: '#ffffff',
        p: 1.5,
        pr: 5,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        position: 'relative',
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* 標題內容 */}
      {type === 'gym' ? (
        <Box
          component="a"
          href="https://rent.pe.ntu.edu.tw/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          sx={{
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.125rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            flex: 1,
            minWidth: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Typography component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </Typography>
          <Typography component="span" sx={{ fontSize: '1rem', flexShrink: 0 }}>
            →
          </Typography>
        </Box>
      ) : type === 'library' ? (
        <Box
          component="a"
          href="https://www.lib.ntu.edu.tw/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          sx={{
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.125rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            flex: 1,
            minWidth: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Typography component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </Typography>
          <Typography component="span" sx={{ fontSize: '1rem', flexShrink: 0 }}>
            →
          </Typography>
        </Box>
      ) : (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 700, 
            fontSize: '1.125rem',
            color: '#ffffff',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Typography>
      )}
      
      {/* 關閉按鈕 - 絕對定位在右上角 */}
      <Box
        component="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          width: 32,
          height: 32,
          minWidth: 32,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 0,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
          },
        }}
      >
        <CloseIcon sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }} />
      </Box>
    </Box>
  );
}

