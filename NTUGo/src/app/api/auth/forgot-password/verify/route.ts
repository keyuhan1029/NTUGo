import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationModel } from '@/lib/models/EmailVerification';
import { UserModel } from '@/lib/models/User';
import { isValidEmail } from '@/lib/utils/verification';

const MAX_ATTEMPTS = parseInt(process.env.VERIFICATION_CODE_MAX_ATTEMPTS || '5', 10);

/**
 * 驗證忘記密碼驗證碼 API
 * POST /api/auth/forgot-password/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 驗證輸入
    if (!email || !code) {
      return NextResponse.json(
        { message: '請提供郵箱和驗證碼' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: '郵箱格式不正確' },
        { status: 400 }
      );
    }

    if (typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: '驗證碼格式不正確（應為 6 位數字）' },
        { status: 400 }
      );
    }

    // 檢查用戶是否存在
    const user = await UserModel.findByEmail(email);
    if (!user || (user.provider === 'google' && !user.password)) {
      // 為了安全，不透露用戶是否存在
      return NextResponse.json(
        { message: '驗證碼錯誤或已失效' },
        { status: 400 }
      );
    }

    // 查找有效的驗證碼
    const verification = await EmailVerificationModel.findValidCode(email, code);

    if (!verification) {
      // 檢查是否有過期的驗證碼
      const recentCodes = await EmailVerificationModel.findRecentCodes(email, 60);
      const hasRecentCode = recentCodes.some(v => !v.verified && v.code === code);
      
      if (hasRecentCode) {
        return NextResponse.json(
          { message: '驗證碼已過期，請重新發送' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: '驗證碼錯誤或已失效' },
        { status: 400 }
      );
    }

    // 檢查嘗試次數
    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: '驗證嘗試次數過多，請重新發送驗證碼' },
        { status: 400 }
      );
    }

    // 增加嘗試次數
    const newAttempts = await EmailVerificationModel.incrementAttempts(verification._id!);

    // 如果嘗試次數超過限制，不再驗證
    if (newAttempts > MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: '驗證嘗試次數過多，請重新發送驗證碼' },
        { status: 400 }
      );
    }

    // 驗證碼匹配，標記為已驗證
    await EmailVerificationModel.markAsVerified(verification._id!);

    // 生成臨時 token（用於重置密碼頁面驗證）
    // 這裡我們使用驗證碼 ID 作為 token，在重置時再次驗證
    const resetToken = verification._id?.toString() || '';

    return NextResponse.json({
      success: true,
      message: '驗證成功',
      verified: true,
      resetToken, // 返回 token 用於重置密碼頁面
    });
  } catch (error: any) {
    console.error('驗證忘記密碼驗證碼失敗:', error);
    return NextResponse.json(
      { message: '驗證失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

