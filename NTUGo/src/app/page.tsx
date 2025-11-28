'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import MainLayout from '@/components/Layout/MainLayout';
import MapComponent from '@/components/Map/MapComponent';

function OverlayCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: 4,
        minWidth: 250,
        backdropFilter: 'blur(4px)',
      }}
    >
      <CardContent>
        <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>
        <List dense disablePadding>
          {items.map((item, index) => (
            <ListItem key={index} disablePadding>
              <Box component="span" sx={{ mr: 1 }}>•</Box>
              <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token 無效，清除並重定向
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // 認證成功
        setIsAuthenticated(true);
      } catch (error) {
        // 發生錯誤，清除 token 並重定向
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // 顯示載入中或未認證時不顯示內容
  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // 重定向中，不顯示內容
  }

  return (
    <MainLayout>
      {/* Map Background */}
      <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <MapComponent />
      </Box>

      {/* Overlays - Right Side Stack - 貼底 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16, // 貼底
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ pointerEvents: 'auto' }}>
          <OverlayCard
            title="活動列表"
            items={[
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
            ]}
          />
          <OverlayCard
            title="論壇熱門"
            items={[
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
            ]}
          />
          <OverlayCard
            title="交流版最新消息"
            items={[
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
              'XXXXXXXXXXXXXXX',
            ]}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
