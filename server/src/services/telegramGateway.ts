// =============================================
// Olo.AI — Telegram Gateway (Send/Receive)
// =============================================

import { InlineButton } from '../types/index.js';

const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
    replyToMessageId?: number;
    disableWebPagePreview?: boolean;
  }
): Promise<any> {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode || 'Markdown',
    disable_web_page_preview: options?.disableWebPagePreview ?? true,
  };

  if (options?.replyToMessageId) {
    body.reply_to_message_id = options.replyToMessageId;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram sendMessage error:', data.description);
      // If Markdown parsing fails, retry without parse_mode
      if (data.description?.includes("can't parse")) {
        return sendMessage(botToken, chatId, text, { ...options, parseMode: undefined } as any);
      }
    }
    return data;
  } catch (error) {
    console.error('Telegram sendMessage fetch error:', error);
    return null;
  }
}

export async function sendChatAction(
  botToken: string,
  chatId: string | number,
  action: 'typing' | 'upload_photo' | 'upload_document' = 'typing'
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/sendChatAction`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch (error) {
    console.error('sendChatAction error:', error);
  }
}

export async function setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  const url = `${TELEGRAM_API}${botToken}/setWebhook`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    });
    const data = await response.json();
    console.log('setWebhook result:', data);
    return data.ok;
  } catch (error) {
    console.error('setWebhook error:', error);
    return false;
  }
}

export async function deleteWebhook(botToken: string): Promise<boolean> {
  const url = `${TELEGRAM_API}${botToken}/deleteWebhook`;
  try {
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('deleteWebhook error:', error);
    return false;
  }
}

export async function getMe(botToken: string): Promise<any> {
  const url = `${TELEGRAM_API}${botToken}/getMe`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('getMe error:', error);
    return null;
  }
}

export async function sendMessageWithButtons(
  botToken: string,
  chatId: string | number,
  text: string,
  buttons: InlineButton[],
  options?: { parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML' }
): Promise<any> {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;

  // Arrange buttons in rows (max 2 per row for readability)
  const keyboard: InlineButton[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode || 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: keyboard,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram sendMessageWithButtons error:', data.description);
      // If Markdown parsing fails, retry without parse_mode
      if (data.description?.includes("can't parse")) {
        return sendMessageWithButtons(botToken, chatId, text, buttons, { parseMode: undefined } as any);
      }
    }
    return data;
  } catch (error) {
    console.error('Telegram sendMessageWithButtons fetch error:', error);
    return null;
  }
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/answerCallbackQuery`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (error) {
    console.error('answerCallbackQuery error:', error);
  }
}

// --- Download a file from Telegram and return as Buffer ---
export async function downloadFile(
  botToken: string,
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
  try {
    // Step 1: get file path from Telegram
    const infoUrl = `${TELEGRAM_API}${botToken}/getFile?file_id=${fileId}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    if (!infoData.ok || !infoData.result?.file_path) {
      console.error('downloadFile: getFile failed', infoData);
      return null;
    }

    const filePath: string = infoData.result.file_path;
    const fileName = filePath.split('/').pop() || 'file';

    // Step 2: download the actual file
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return null;

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Infer mime type from extension
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeMap: Record<string, string> = {
      ogg: 'audio/ogg',
      oga: 'audio/ogg',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    return { buffer, mimeType, fileName };
  } catch (error) {
    console.error('downloadFile error:', error);
    return null;
  }
}
