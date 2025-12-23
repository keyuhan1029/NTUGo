'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'verify' | 'reset'>('email');
  const [loading, setLoading] = React.useState(false);
  const [sendingCode, setSendingCode] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [codeSent, setCodeSent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  // 倒數計時
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('請輸入郵箱地址');
      return;
    }

    setError(null);
    setSendingCode(true);

    try {
      const response = await fetch('/api/auth/forgot-password/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('解析響應失敗:', parseError);
        throw new Error('服務器響應格式錯誤，請稍後再試');
      }

      if (!response.ok) {
        // 顯示詳細錯誤信息
        const errorMsg = data?.message || '發送驗證碼失敗';
        console.error('發送驗證碼錯誤:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(errorMsg);
      }

      console.log('驗證碼發送成功:', data);
      setCodeSent(true);
      setCountdown(60); // 60 秒倒數
      setStep('verify');
    } catch (error: any) {
      console.error('發送驗證碼異常:', error);
      setError(error?.message || '發送驗證碼失敗，請稍後再試');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('請輸入完整的 6 位驗證碼');
      return;
    }

    setError(null);
    setVerifying(true);

    try {
      const response = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('解析響應失敗:', parseError);
        throw new Error('服務器響應格式錯誤，請稍後再試');
      }

      if (!response.ok) {
        throw new Error(data?.message || '驗證失敗');
      }

      if (!data.resetToken) {
        throw new Error('未收到重置令牌，請重新驗證');
      }

      setResetToken(data.resetToken);
      setStep('reset');
    } catch (error: any) {
      console.error('驗證驗證碼異常:', error);
      setError(error?.message || '驗證失敗，請檢查驗證碼是否正確');
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!newPassword || !confirmPassword) {
      setError('請輸入新密碼和確認密碼');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('密碼長度至少需要 6 個字符');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      setLoading(false);
      return;
    }

    try {
      if (!resetToken) {
        throw new Error('重置令牌無效，請重新申請');
      }

      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('解析響應失敗:', parseError);
        throw new Error('服務器響應格式錯誤，請稍後再試');
      }

      if (!response.ok) {
        throw new Error(data?.message || '重置密碼失敗');
      }

      // 重置成功，跳轉到登入頁面
      router.push('/login?message=' + encodeURIComponent('密碼重置成功，請使用新密碼登入'));
    } catch (error: any) {
      console.error('重置密碼異常:', error);
      setError(error?.message || '重置密碼失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPageLayout>
      <Box>
        {/* Title */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 1,
            fontWeight: 700,
            color: '#1a1a2e',
            textAlign: 'left',
            fontSize: { xs: '1.75rem', md: '2rem' },
          }}
        >
          {step === 'email' && '忘記密碼'}
          {step === 'verify' && '驗證郵箱'}
          {step === 'reset' && '重置密碼'}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: '#757575',
            textAlign: 'left',
          }}
        >
          {step === 'email' && '請輸入您的郵箱地址，我們將發送驗證碼給您'}
          {step === 'verify' && '請輸入發送到您郵箱的 6 位驗證碼'}
          {step === 'reset' && '請輸入您的新密碼'}
        </Typography>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <Box>
            <TextField
              label="E-mail address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
              placeholder="請輸入您的郵箱地址"
              disabled={sendingCode}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendCode();
                }
              }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSendCode}
              disabled={sendingCode || !email.trim()}
              sx={{
                py: 1.5,
                mb: 3,
                backgroundColor: '#0F4C75',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              {sendingCode ? <CircularProgress size={24} /> : '發送驗證碼'}
            </Button>
          </Box>
        )}

        {/* Step 2: Verification Code */}
        {step === 'verify' && (
          <Box>
            <TextField
              label="驗證碼"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
              placeholder="請輸入 6 位數字驗證碼"
              disabled={verifying}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
              }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleVerifyCode}
              disabled={verifying || code.length !== 6}
              sx={{
                py: 1.5,
                mb: 2,
                backgroundColor: '#0F4C75',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              {verifying ? <CircularProgress size={24} /> : '驗證'}
            </Button>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {countdown > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  重新發送驗證碼 ({countdown} 秒)
                </Typography>
              ) : (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                >
                  重新發送驗證碼
                </Button>
              )}
            </Box>
            <Button
              variant="text"
              fullWidth
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            >
              返回修改郵箱
            </Button>
          </Box>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <Box component="form" onSubmit={handleResetPassword}>
            <TextField
              name="newPassword"
              label="新密碼"
              type="password"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
              placeholder="請輸入新密碼（至少 6 個字符）"
              disabled={loading}
              required
            />
            <TextField
              name="confirmPassword"
              label="確認密碼"
              type="password"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
              placeholder="請再次輸入新密碼"
              disabled={loading}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 3,
                backgroundColor: '#0F4C75',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : '重置密碼'}
            </Button>
          </Box>
        )}

        {/* Back to Login */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            記起密碼了？{' '}
            <Link
              href="/login"
              sx={{
                color: '#0F4C75',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              返回登入
            </Link>
          </Typography>
        </Box>
      </Box>
    </LoginPageLayout>
  );
}

