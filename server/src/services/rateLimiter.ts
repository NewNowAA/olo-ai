// =============================================
// Olo.AI — Rate Limiter (Anti-Spam)
// =============================================
//
// In-memory rate limiter per user.
// - Burst: max 1 msg per 5 seconds
// - Hourly: max 30 msgs per hour
// - Auto-cleanup every 5 minutes
//

interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

const userTimestamps = new Map<string, number[]>();

const BURST_WINDOW_MS = 5_000;       // 5 seconds
const BURST_MAX = 1;                  // 1 message per burst window
const HOURLY_WINDOW_MS = 3_600_000;   // 1 hour
const HOURLY_MAX = 30;                // 30 messages per hour
const CLEANUP_INTERVAL_MS = 300_000;  // 5 minutes

/**
 * Check if a user is allowed to send a message.
 * Returns { allowed: true } if OK, or { allowed: false, message: '...' } if rate limited.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  let timestamps = userTimestamps.get(userId);

  if (!timestamps) {
    timestamps = [];
    userTimestamps.set(userId, timestamps);
  }

  // Clean old entries (older than 1 hour)
  const cutoff = now - HOURLY_WINDOW_MS;
  const filtered = timestamps.filter(t => t > cutoff);
  userTimestamps.set(userId, filtered);
  timestamps = filtered;

  // --- Check burst limit (1 msg per 5s) ---
  const burstCutoff = now - BURST_WINDOW_MS;
  const recentBurst = timestamps.filter(t => t > burstCutoff);
  if (recentBurst.length >= BURST_MAX) {
    return {
      allowed: false,
      message: '⏳ Calma, ainda estou a processar!',
    };
  }

  // --- Check hourly limit (30 msgs/hour) ---
  if (timestamps.length >= HOURLY_MAX) {
    return {
      allowed: false,
      message: '⚠️ Atingiste o limite de mensagens. Tenta mais tarde.',
    };
  }

  // Record this message timestamp
  timestamps.push(now);

  return { allowed: true };
}

// --- Auto-cleanup: remove users with no recent activity ---
function cleanupOldEntries(): void {
  const now = Date.now();
  const cutoff = now - HOURLY_WINDOW_MS;

  for (const [userId, timestamps] of userTimestamps.entries()) {
    const active = timestamps.filter(t => t > cutoff);
    if (active.length === 0) {
      userTimestamps.delete(userId);
    } else {
      userTimestamps.set(userId, active);
    }
  }
}

// Start cleanup interval
setInterval(cleanupOldEntries, CLEANUP_INTERVAL_MS);

// Export for testing
export function _resetForTesting(): void {
  userTimestamps.clear();
}
