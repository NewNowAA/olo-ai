// =============================================
// Olo.AI — Server Entry Point
// =============================================

import 'dotenv/config';
import express from 'express';

// --- Catch unhandled rejections/exceptions before they kill the process ---
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

import telegramRoutes, { processUpdate } from './routes/telegramRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import { startPolling } from './services/telegramPoller.js';
import * as store from './services/supabaseStore.js';

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

// --- CORS (must be first — before any other middleware) ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- Middleware ---
app.use((req, res, next) => {
  console.log(`\n\n[ROUTER DUMP] 🔥 Hit: ${req.method} ${req.url}`);
  next();
});
app.use(express.json());

// --- Request logging ---
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} — ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// --- Routes ---
app.use('/api/telegram', telegramRoutes);
app.use('/api', apiRoutes);

// --- Root ---
app.get('/', (_req, res) => {
  res.json({
    name: 'Olo.AI Server',
    version: '1.0.0',
    description: 'O teu atendente que nunca dorme. 🤖',
    endpoints: {
      health: '/api/health',
      telegram_webhook: '/api/telegram/webhook',
      set_webhook: '/api/telegram/set-webhook',
    },
  });
});

// --- Error handler ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║           🤖  OLO.AI SERVER             ║
║──────────────────────────────────────────║
║  Port: ${String(PORT).padEnd(33)}║
║  Mode: ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║  Time: ${new Date().toISOString().padEnd(33)}║
╚══════════════════════════════════════════╝
  `);

  // Validate env vars (TELEGRAM_BOT_TOKEN is optional — loaded from DB per org)
  const required = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`);
    console.warn('   Some features may not work correctly.');
  } else {
    console.log('✅ All required environment variables configured.');
  }

  // --- Auto-start Telegram polling ---
  // Token source priority: env var → first org in DB with a token configured
  const webhookUrl = process.env.WEBHOOK_BASE_URL || '';
  const hasValidWebhook = webhookUrl.startsWith('https://') && !webhookUrl.includes('localhost');

  if (!hasValidWebhook) {
    (async () => {
      try {
        let botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          const { data: firstOrg } = await store.getSupabase()
            .from('organizations')
            .select('telegram_bot_token')
            .not('telegram_bot_token', 'is', null)
            .limit(1)
            .single();
          botToken = firstOrg?.telegram_bot_token;
        }
        if (botToken) {
          console.log('📡 Starting Telegram polling...');
          await startPolling(botToken, processUpdate);
        } else {
          console.log('ℹ️  No bot token found. Connect a bot in Settings to start.');
        }
      } catch (err) {
        console.error('[Polling] Failed to start:', err);
      }
    })();
  }

  // --- Reservation cleanup timer (every 5 minutes) ---
  setInterval(async () => {
    try {
      await store.releaseExpiredReservations();
    } catch (err) {
      console.error('[ReservationTimer] Error:', err);
    }
  }, 5 * 60 * 1000);
  console.log('⏰ Reservation cleanup timer started (every 5min).');
});

export default app;
