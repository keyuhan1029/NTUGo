import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { MessageModel } from '@/lib/models/Message';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// 保存 AI 客服的回复消息
export async function POST(request: Request, { params }: RouteParams) {
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

    const { roomId } = await params;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: '無效的聊天室 ID' },
        { status: 400 }
      );
    }

    // 检查是否为 AI 聊天室
    const chatRoom = await ChatRoomModel.findById(roomId);
    if (!chatRoom || chatRoom.type !== 'ai') {
      return NextResponse.json(
        { message: '此聊天室不是 AI 聊天室' },
        { status: 400 }
      );
    }

    // 检查用户是否为聊天室成员
    const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
    if (!isMember) {
      return NextResponse.json(
        { message: '您不是此聊天室的成員' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: '訊息內容不能為空' },
        { status: 400 }
      );
    }

    // 使用特殊的 senderId 'ai-support' 来标识 AI 消息
    // 我们需要创建一个特殊的 ObjectId 或者使用字符串
    // 为了简化，我们使用一个固定的 ObjectId
    const aiSenderId = new ObjectId('000000000000000000000000'); // 特殊 ID 表示 AI

    // 创建消息
    const message = await MessageModel.create(roomId, aiSenderId, content.trim(), {
      type: 'text',
    });

    // 更新聊天室最后消息
    await ChatRoomModel.updateLastMessage(roomId, content.trim());

    return NextResponse.json({
      message: {
        id: message._id instanceof ObjectId ? message._id.toString() : String(message._id),
        senderId: 'ntu-ai-support', // 使用字符串 ID 用于前端显示
        sender: {
          id: 'ntu-ai-support',
          userId: null,
          name: 'NTU AI 客服',
          avatar: null,
        },
        type: message.type,
        content: message.content,
        file: message.file || null,
        createdAt: message.createdAt,
        isOwn: false,
        readBy: [payload.userId], // 用户已读
      },
    });
  } catch (error: any) {
    console.error('保存 AI 訊息錯誤:', error);
    return NextResponse.json(
      { message: '保存 AI 訊息失敗' },
      { status: 500 }
    );
  }
}

