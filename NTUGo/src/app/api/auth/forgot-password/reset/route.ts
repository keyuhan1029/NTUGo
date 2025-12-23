import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationModel } from '@/lib/models/EmailVerification';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

/**
 * 重置密碼 API
 * POST /api/auth/forgot-password/reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, resetToken, newPassword, confirmPassword } = body;

    // 驗證輸入
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: '請提供所有必要欄位' },
        { status: 400 }
      );
    }

    // 驗證密碼長度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: '密碼長度至少需要 6 個字符' },
        { status: 400 }
      );
    }

    // 驗證兩次密碼是否一致
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: '兩次輸入的密碼不一致' },
        { status: 400 }
      );
    }

    // 驗證 resetToken（驗證碼 ID）是否有效且已驗證
    let verificationId: ObjectId;
    try {
      verificationId = new ObjectId(resetToken);
    } catch {
      return NextResponse.json(
        { message: '無效的重置令牌' },
        { status: 400 }
      );
    }

    // 檢查驗證碼記錄是否存在且已驗證
    const db = await (await import('@/lib/mongodb')).getDatabase();
    const verification = await db.collection('email_verifications').findOne({
      _id: verificationId,
      email,
      verified: true,
    });

    if (!verification) {
      return NextResponse.json(
        { message: '無效或已過期的重置令牌，請重新申請' },
        { status: 400 }
      );
    }

    // 檢查驗證碼是否在 30 分鐘內（重置密碼的有效期）
    const now = new Date();
    const verifiedAt = verification.verifiedAt ? new Date(verification.verifiedAt) : null;
    if (!verifiedAt || (now.getTime() - verifiedAt.getTime()) > 30 * 60 * 1000) {
      return NextResponse.json(
        { message: '重置令牌已過期，請重新申請' },
        { status: 400 }
      );
    }

    // 檢查用戶是否存在
    const user = await UserModel.findByEmail(email);
    if (!user || (user.provider === 'google' && !user.password)) {
      return NextResponse.json(
        { message: '用戶不存在或無法重置密碼' },
        { status: 400 }
      );
    }

    // 更新密碼
    const updated = await UserModel.updatePassword(email, newPassword);
    if (!updated) {
      return NextResponse.json(
        { message: '重置密碼失敗，請稍後再試' },
        { status: 500 }
      );
    }

    // 刪除已使用的驗證碼記錄
    await db.collection('email_verifications').deleteOne({ _id: verificationId });

    return NextResponse.json({
      success: true,
      message: '密碼重置成功，請使用新密碼登入',
    });
  } catch (error: any) {
    console.error('重置密碼失敗:', error);
    return NextResponse.json(
      { message: '重置密碼失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

