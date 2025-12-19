import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';

// 创建或获取 AI 客服聊天室
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

    // 创建或获取 AI 聊天室
    const chatRoom = await ChatRoomModel.createOrGetAIChat(payload.userId);

    return NextResponse.json({
      chatRoom: {
        id: chatRoom._id instanceof Object ? chatRoom._id.toString() : String(chatRoom._id),
        type: chatRoom.type,
        name: chatRoom.name,
        members: chatRoom.members.map(m => m.toString()),
        createdAt: chatRoom.createdAt,
        updatedAt: chatRoom.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('建立 AI 聊天室錯誤:', error);
    return NextResponse.json(
      { message: '建立 AI 聊天室失敗' },
      { status: 500 }
    );
  }
}

