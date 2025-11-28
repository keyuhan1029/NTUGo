'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 實作登入邏輯
    console.log('登入:', { email, password });
  };

  const handleGoogleLogin = () => {
    // TODO: 實作 Google 登入邏輯
    console.log('Google 登入');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          src="/logo.svg"
          alt="NTUGo Logo"
          width={300}
          height={90}
          priority
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </Box>

      {/* Login Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#ffffff',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: '#212121',
              textAlign: 'left',
            }}
          >
            登入
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <TextField
              fullWidth
              type="email"
              label="電子郵件"
              placeholder="電子郵件"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              type="password"
              label="密碼"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                },
              }}
            />
            
            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Link
                href="#"
                sx={{
                  fontSize: '0.875rem',
                  color: '#757575',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                忘記密碼?
              </Link>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: '#0F4C75',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              登入
            </Button>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Divider sx={{ flexGrow: 1 }} />
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  color: '#757575',
                }}
              >
                或
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>

            {/* Google Login Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                borderColor: '#e0e0e0',
                backgroundColor: '#ffffff',
                color: '#212121',
                fontWeight: 500,
                fontSize: '1rem',
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                '&:hover': {
                  borderColor: '#bdbdbd',
                  backgroundColor: '#fafafa',
                },
              }}
            >
              {/* Google Logo */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              以 Google 帳戶登入
            </Button>

            {/* Create Account Link */}
            <Box
              sx={{
                textAlign: 'center',
                mt: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#757575',
                }}
              >
                沒有帳戶?{' '}
                <Link
                  href="#"
                  sx={{
                    color: '#0F4C75',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  建立帳戶
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

