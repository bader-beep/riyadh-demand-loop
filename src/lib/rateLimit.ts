import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from './constants';

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory rate limit store
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 60000);

/**
 * Check rate limit for a given key (user_hash or IP).
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { timestamps: [now] });
    return true;
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}
