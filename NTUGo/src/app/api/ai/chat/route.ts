import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { DocumentModel } from '@/lib/models/Document';
import OpenAI from 'openai';

// 系统提示词：限制 AI 只能回答台大相关问题
const SYSTEM_PROMPT = `你是一個專門回答台灣大學（NTU）相關問題的 AI 助手。你的職責是：

1. 只回答與台灣大學（NTU）相關的問題
2. 基於提供的資料庫文檔來回答問題
3. 如果問題與台大無關，請禮貌地告知用戶你只能回答台大相關問題
4. 如果資料庫中沒有相關資訊，請誠實告知，不要編造答案
5. 回答要準確、清晰、有幫助
6. 使用繁體中文回答

請記住：你只能回答台大相關的問題，並且只能基於提供的資料來回答。`;

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

    // 检查 OpenAI API Key
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { message: 'OpenAI API Key 未設定' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: '請提供有效的問題' },
        { status: 400 }
      );
    }

    // 获取所有活跃文档的 OpenAI 文件ID（让GPT直接读取PDF）
    const openaiFileIds = await DocumentModel.getOpenAIFileIds();
    console.log('[AI Chat] 找到OpenAI文件ID数量:', openaiFileIds.length);
    
    // 从数据库检索相关文档块（作为备用，如果OpenAI文件不可用）
    console.log('[AI Chat] 开始检索文档，查询:', message);
    const relevantChunks = await DocumentModel.searchRelevantChunks(message, 5);
    console.log('[AI Chat] 检索到文档块数量:', relevantChunks.length);
    
    // 构建上下文（如果OpenAI文件不可用，使用文本块）
    let context = '';
    if (openaiFileIds.length > 0) {
      context = '\n\n我已為你準備了相關的PDF文檔，請直接從這些文檔中查找答案。';
      console.log('[AI Chat] 使用OpenAI Files API，文件ID:', openaiFileIds);
    } else if (relevantChunks.length > 0) {
      context = '\n\n以下是相關的資料庫文檔內容：\n\n';
      relevantChunks.forEach((chunk, index) => {
        context += `[文檔片段 ${index + 1}]\n${chunk.substring(0, 500)}${chunk.length > 500 ? '...' : ''}\n\n`;
      });
      console.log('[AI Chat] 使用文本块，上下文长度:', context.length, '字符');
    } else {
      context = '\n\n注意：資料庫中沒有找到與此問題直接相關的文檔。請基於你對台大的了解回答，如果無法確定，請告知用戶資料庫中沒有相關資訊。';
      console.log('[AI Chat] 警告：未找到相关文档');
    }

    // 构建消息历史
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + context,
      },
    ];
    
    // 如果有OpenAI文件ID，添加到消息中（使用Assistants API方式）
    // 注意：Chat Completions API不支持直接附加文件，需要使用Assistants API
    // 但我们可以通过修改提示词来引导GPT使用文件内容

    // 添加对话历史（最近 10 条）
    const recentHistory = conversationHistory.slice(-10);
    for (const item of recentHistory) {
      if (item.role === 'user' || item.role === 'assistant') {
        messages.push({
          role: item.role,
          content: item.content,
        });
      }
    }

    // 添加当前问题
    messages.push({
      role: 'user',
      content: message,
    });

    // 调用 OpenAI API
    const openai = new OpenAI({ apiKey });
    
    // 如果有OpenAI文件ID，使用Assistants API让GPT直接读取PDF
    if (openaiFileIds.length > 0) {
      try {
        console.log('[AI Chat] 使用Assistants API读取PDF文件，文件ID:', openaiFileIds);
        
        // 创建Assistant，直接附加文件
        // 注意：新版本的OpenAI API需要使用Vector Store，但为了兼容性，先尝试直接附加文件
        const assistant = await (openai.beta.assistants as any).create({
          name: 'NTU AI 客服',
          instructions: SYSTEM_PROMPT + '\n\n請從上傳的PDF文檔中查找相關資訊來回答問題。',
          model: 'gpt-4o-mini',
          tools: [{ type: 'file_search' }],
          file_ids: openaiFileIds, // 直接附加文件ID
        });
        
        console.log('[AI Chat] Assistant创建成功，ID:', assistant.id, '附加文件数:', openaiFileIds.length);
        
        // 创建Thread并添加消息
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        });
        
        console.log('[AI Chat] Thread创建成功，ID:', thread.id);
        
        // 运行Assistant（会自动读取附加的文件）
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant.id,
        });
        
        console.log('[AI Chat] Run创建成功，ID:', run.id, '状态:', run.status);
        
        // 等待运行完成（最多30秒）
        let runStatus: any = await (openai.beta.threads.runs.retrieve as any)(
          thread.id,
          run.id
        );
        let attempts = 0;
        while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await (openai.beta.threads.runs.retrieve as any)(
            thread.id,
            run.id
          );
          attempts++;
          if (attempts % 5 === 0) {
            console.log('[AI Chat] 等待运行完成，状态:', runStatus.status, '尝试次数:', attempts);
          }
        }
        
        console.log('[AI Chat] Run最终状态:', runStatus.status);
        
        if (runStatus.status === 'completed') {
          // 获取消息
          const threadMessages = await openai.beta.threads.messages.list(thread.id);
          const assistantMessage = threadMessages.data.find(m => m.role === 'assistant');
          const aiResponse = assistantMessage?.content[0]?.type === 'text' 
            ? assistantMessage.content[0].text.value 
            : '抱歉，我無法生成回答。';
          
          console.log('[AI Chat] 成功获取AI回答，长度:', aiResponse.length);
          
          return NextResponse.json({
            success: true,
            response: aiResponse,
            usedFiles: openaiFileIds.length,
            method: 'assistants',
          });
        } else {
          console.warn('[AI Chat] Assistant运行未完成，状态:', runStatus.status);
          if (runStatus.last_error) {
            console.error('[AI Chat] Run错误:', runStatus.last_error);
          }
          // 回退到普通Chat API
        }
      } catch (assistantError: any) {
        console.error('[AI Chat] Assistants API错误，回退到Chat API:');
        console.error('  错误类型:', assistantError.name);
        console.error('  错误消息:', assistantError.message);
        console.error('  错误堆栈:', assistantError.stack);
        // 回退到普通Chat API
      }
    }
    
    // 使用普通Chat Completions API（如果没有文件或Assistants失败）
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || '抱歉，我無法生成回答。';

    return NextResponse.json({
      success: true,
      response: aiResponse,
      usedChunks: relevantChunks.length,
      usedFiles: openaiFileIds.length,
      method: 'chat',
    });
  } catch (error: any) {
    console.error('OpenAI API 錯誤:', error);
    
    // 处理 OpenAI API 错误
    if (error.response) {
      return NextResponse.json(
        { 
          message: 'OpenAI API 錯誤: ' + (error.response.data?.error?.message || '未知錯誤'),
          error: error.response.data,
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { message: 'AI 服務錯誤: ' + (error.message || '未知錯誤') },
      { status: 500 }
    );
  }
}

