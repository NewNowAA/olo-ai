// =============================================
// Olo.AI — Server Entry Point
// =============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import telegramRoutes from './routes/telegramRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// --- Middleware ---
app.use(cors());
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

  // Validate env vars
  const required = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TELEGRAM_BOT_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`);
    console.warn('   Some features may not work correctly.');
  } else {
    console.log('✅ All required environment variables configured.');
  }
});

export default app;
