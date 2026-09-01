// In-memory sliding window rate limiter for anti-abuse and spam protection

interface RateLimitRecord {
  timestamps: number[];
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  /**
   * Checks if a key has exceeded max requests within the specified window in milliseconds.
   * If allowed, records the request and returns { allowed: true, remaining: number }.
   * If exceeded, returns { allowed: false, retryAfterSec: number }.
   */
  public check(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec?: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter(t => now - t < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec: Math.max(1, retryAfterSec) };
    }

    record.timestamps.push(now);
    return { allowed: true, remaining: maxRequests - record.timestamps.length };
  }

  /**
   * Periodically purge expired records to maintain zero memory leakage
   */
  public cleanup(maxAgeMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < maxAgeMs);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Run cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
