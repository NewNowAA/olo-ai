// =============================================
// Olo.AI — Telegram Polling Service
// =============================================
// Used in LOCAL DEVELOPMENT when no public webhook URL is available.
// In production, use webhooks instead (telegramRoutes.ts).
//
// Polling flow:
//  1. Calls getUpdates with long polling (timeout=30s)
//  2. Processes each update through the same handler as webhooks
//  3. Marks updates as read with the offset
// =============================================

import { TelegramUpdate } from '../types/index.js';

const TELEGRAM_API = 'https://api.telegram.org/bot';

type UpdateHandler = (update: TelegramUpdate) => Promise<void>;

let pollingActive = false;
let pollingOffset = 0;

export async function startPolling(botToken: string, handler: UpdateHandler): Promise<void> {
  if (pollingActive) return;

  // First, delete any existing webhook so polling works
  try {
    await fetch(`${TELEGRAM_API}${botToken}/deleteWebhook`, { method: 'POST' });
    console.log('[TelegramPoller] Webhook cleared — polling mode active.');
  } catch {}

  pollingActive = true;
  console.log(`[TelegramPoller] Starting long-polling for bot token ...${botToken.slice(-8)}`);

  // Run polling loop in background (no await)
  pollLoop(botToken, handler).catch(err => {
    console.error('[TelegramPoller] Fatal error in poll loop:', err);
    pollingActive = false;
  });
}

export function stopPolling(): void {
  pollingActive = false;
  console.log('[TelegramPoller] Polling stopped.');
}

async function pollLoop(botToken: string, handler: UpdateHandler): Promise<void> {
  while (pollingActive) {
    try {
      const url = `${TELEGRAM_API}${botToken}/getUpdates?timeout=30&offset=${pollingOffset}`;
      const res = await fetch(url);

      if (!res.ok) {
        console.error(`[TelegramPoller] getUpdates failed: ${res.status}`);
        await sleep(5000);
        continue;
      }

      const data = await res.json();
      if (!data.ok) {
        console.error('[TelegramPoller] getUpdates error:', data.description);
        await sleep(5000);
        continue;
      }

      const updates: TelegramUpdate[] = data.result || [];

      for (const update of updates) {
        // Advance offset so we don't re-process this update
        pollingOffset = update.update_id + 1;

        // Process asynchronously (don't block the polling loop)
        handler(update).catch(err => {
          console.error('[TelegramPoller] Error handling update:', err);
        });
      }
    } catch (err) {
      if (pollingActive) {
        console.error('[TelegramPoller] Network error, retrying in 5s:', err);
        await sleep(5000);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
