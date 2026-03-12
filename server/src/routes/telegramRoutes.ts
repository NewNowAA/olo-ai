// =============================================
// Olo.AI — Telegram Webhook Routes
// =============================================

import { Router, Request, Response } from 'express';
import { TelegramUpdate, TelegramCallbackQuery, UserContext, Role } from '../types/index.js';
import * as store from '../services/supabaseStore.js';
import * as telegram from '../services/telegramGateway.js';
import * as assistantEngine from '../services/assistantEngine.js';
import { checkRateLimit } from '../services/rateLimiter.js';

const router = Router();

// --- Webhook endpoint ---
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update: TelegramUpdate = req.body;

    // Respond immediately to Telegram (they timeout at 60s)
    res.status(200).json({ ok: true });

    // Process in background
    await processUpdate(update).catch(err => {
      console.error('[Telegram] Error processing update:', err);
    });

  } catch (error) {
    console.error('[Telegram] Webhook error:', error);
    res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
});

// --- Set webhook endpoint (admin utility) ---
router.post('/set-webhook', async (req: Request, res: Response) => {
  const { bot_token, webhook_url } = req.body;
  const token = bot_token || process.env.TELEGRAM_BOT_TOKEN;
  const url = webhook_url || `${process.env.WEBHOOK_BASE_URL}/api/telegram/webhook`;

  if (!token || !url) {
    res.status(400).json({ error: 'Missing bot_token or webhook_url' });
    return;
  }

  const success = await telegram.setWebhook(token, url);
  res.json({ success, webhook_url: url });
});

// --- Process a Telegram Update ---
async function processUpdate(update: TelegramUpdate): Promise<void> {
  // Handle callback queries (inline button presses)
  if (update.callback_query) {
    await processCallbackQuery(update.callback_query);
    return;
  }

  const message = update.message;
  if (!message || !message.text) return; // Only handle text for now

  const telegramChatId = String(message.chat.id);
  const telegramUserId = String(message.from.id);
  const text = message.text;
  const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');

  console.log(`[Telegram] Message from ${senderName} (${telegramUserId}): ${text.substring(0, 100)}`);

  // --- Rate limit check ---
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const rateCheck = checkRateLimit(telegramUserId);
  if (!rateCheck.allowed) {
    console.log(`[Telegram] Rate limited user ${telegramUserId}`);
    await telegram.sendMessage(botToken, telegramChatId, rateCheck.message!);
    return;
  }

  // --- Determine which org this bot belongs to ---
  let org = await store.getOrgByTelegramToken(botToken);

  // Fallback: use the first org (single-tenant mode for MVP)
  if (!org) {
    const { data } = await store.getSupabase().from('organizations').select('*').limit(1).single();
    org = data;
  }

  if (!org) {
    await telegram.sendMessage(botToken, telegramChatId,
      '⚠️ Nenhuma organização configurada. Contacte o administrador.');
    return;
  }

  // --- Determine user role ---
  const role = await resolveRole(telegramUserId, org.id);

  // --- Get or create customer ---
  const customer = await store.getOrCreateCustomer(
    org.id, 'telegram', telegramUserId, senderName
  );

  const userContext: UserContext = {
    role,
    orgId: org.id,
    customerId: customer?.id,
    telegramId: telegramUserId,
    channel: 'telegram',
  };

  // --- Show typing indicator ---
  await telegram.sendChatAction(botToken, telegramChatId);

  // --- Handle /start command ---
  if (text === '/start') {
    const greeting = await assistantEngine.handleStart(userContext, org, customer);
    await telegram.sendMessage(botToken, telegramChatId, greeting);
    return;
  }

  // --- Process message through AI ---
  await processAIMessage(text, userContext, org, customer, botToken, telegramChatId, false);
}

// --- Process Callback Query (inline button press) ---
async function processCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const telegramChatId = String(callbackQuery.message?.chat.id || callbackQuery.from.id);
  const telegramUserId = String(callbackQuery.from.id);
  const callbackData = callbackQuery.data || '';
  const senderName = [callbackQuery.from.first_name, callbackQuery.from.last_name].filter(Boolean).join(' ');

  console.log(`[Telegram] Callback from ${senderName} (${telegramUserId}): ${callbackData}`);

  // Answer the callback query (removes the loading spinner on the button)
  await telegram.answerCallbackQuery(botToken, callbackQuery.id);

  // --- Determine which org this bot belongs to ---
  let org = await store.getOrgByTelegramToken(botToken);
  if (!org) {
    const { data } = await store.getSupabase().from('organizations').select('*').limit(1).single();
    org = data;
  }

  if (!org) {
    await telegram.sendMessage(botToken, telegramChatId,
      '⚠️ Nenhuma organização configurada. Contacte o administrador.');
    return;
  }

  // --- Determine user role ---
  const role = await resolveRole(telegramUserId, org.id);

  // --- Get or create customer ---
  const customer = await store.getOrCreateCustomer(
    org.id, 'telegram', telegramUserId, senderName
  );

  const userContext: UserContext = {
    role,
    orgId: org.id,
    customerId: customer?.id,
    telegramId: telegramUserId,
    channel: 'telegram',
  };

  // --- Show typing indicator ---
  await telegram.sendChatAction(botToken, telegramChatId);

  // --- Process the callback data as a message with isCallbackQuery flag ---
  await processAIMessage(callbackData, userContext, org, customer, botToken, telegramChatId, true);
}

// --- Shared AI message processing ---
async function processAIMessage(
  text: string,
  userContext: UserContext,
  org: any,
  customer: any,
  botToken: string,
  chatId: string,
  isCallbackQuery: boolean
): Promise<void> {
  try {
    const response = await assistantEngine.handleMessage(text, userContext, org, customer, { isCallbackQuery });

    // Check if response has inline buttons
    const buttons = response.inlineButtons;
    const maxLen = 4096;

    if (buttons && buttons.length > 0) {
      // Send message with inline buttons
      await telegram.sendMessageWithButtons(botToken, chatId, response.text, buttons);
    } else if (response.text.length <= maxLen) {
      await telegram.sendMessage(botToken, chatId, response.text);
    } else {
      // Split into chunks
      const chunks = splitMessage(response.text, maxLen);
      for (const chunk of chunks) {
        await telegram.sendMessage(botToken, chatId, chunk);
      }
    }

    console.log(`[Telegram] Response sent (${response.tokensUsed} tokens, ${response.toolCalls.length} tools${isCallbackQuery ? ', callback' : ''})`);

  } catch (error: any) {
    console.error('[Telegram] AI processing error:', error);
    await telegram.sendMessage(botToken, chatId,
      'Desculpa, tive um problema a processar a tua mensagem. Tenta novamente. 🙏');
  }
}

// --- Resolve user role from Telegram ID ---
async function resolveRole(telegramId: string, orgId: string): Promise<Role> {
  // Check if dev
  const devIds = await store.getDevTelegramIds();
  if (devIds.includes(telegramId)) return 'dev';

  // Check if owner (by org's telegram_chat_id)
  const ownerTgId = await store.getOwnerTelegramId(orgId);
  if (ownerTgId === telegramId) return 'owner';

  // Default: client
  return 'client';
}

// --- Split long messages ---
function splitMessage(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to split at newline
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen / 2) {
      // Try to split at space
      splitAt = remaining.lastIndexOf(' ', maxLen);
    }
    if (splitAt === -1 || splitAt < maxLen / 2) {
      splitAt = maxLen;
    }

    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks;
}

export default router;
