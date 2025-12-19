import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { MessageModel } from '@/lib/models/Message';
import { ObjectId } from 'mongodb';

// 清除 AI 聊天室的所有消息
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    // 获取用户的 AI 聊天室
    const chatRoom = await ChatRoomModel.createOrGetAIChat(payload.userId);
    
    if (!chatRoom._id) {
      return NextResponse.json(
        { message: '找不到 AI 聊天室' },
        { status: 404 }
      );
    }

    const roomId = chatRoom._id instanceof ObjectId ? chatRoom._id : new ObjectId(chatRoom._id);

    // 删除所有消息
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    const deleteResult = await db.collection('messages').deleteMany({
      chatRoomId: roomId,
    });

    // 更新聊天室的最后消息
    await ChatRoomModel.updateLastMessage(roomId, '');

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      message: 'AI 聊天記錄已清除',
    });
  } catch (error: any) {
    console.error('清除 AI 聊天記錄錯誤:', error);
    return NextResponse.json(
      { message: '清除聊天記錄失敗' },
      { status: 500 }
    );
  }
}

