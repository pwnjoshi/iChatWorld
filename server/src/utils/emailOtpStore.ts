import crypto from 'crypto';

interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
}

interface RequestRateRecord {
  count: number;
  resetAt: number;
}

class EmailOtpStore {
  private otps: Map<string, OtpRecord> = new Map();
  private rateLimits: Map<string, RequestRateRecord> = new Map();

  constructor() {
    // Background purge every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  private hashOtp(email: string, otp: string): string {
    return crypto.createHash('sha256').update(`${email.toLowerCase().trim()}:${otp}`).digest('hex');
  }

  /**
   * Check rate limiting: max 3 OTP requests per email per 10 minutes
   */
  public canRequestOtp(email: string): { allowed: boolean; retryAfterSec?: number } {
    const key = email.toLowerCase().trim();
    const now = Date.now();
    const rate = this.rateLimits.get(key);

    if (rate) {
      if (now < rate.resetAt) {
        if (rate.count >= 3) {
          return { allowed: false, retryAfterSec: Math.ceil((rate.resetAt - now) / 1000) };
        }
        rate.count += 1;
      } else {
        this.rateLimits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
      }
    } else {
      this.rateLimits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    }

    return { allowed: true };
  }

  /**
   * Generate and store a secure 6-digit OTP
   */
  public generateOtp(email: string): string {
    const cleanEmail = email.toLowerCase().trim();
    const otp = crypto.randomInt(100000, 999999).toString();
    const hash = this.hashOtp(cleanEmail, otp);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    this.otps.set(cleanEmail, {
      hash,
      expiresAt,
      attempts: 0
    });

    return otp;
  }

  /**
   * Verify provided OTP
   */
  public verifyOtp(email: string, providedOtp: string): { success: boolean; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const record = this.otps.get(cleanEmail);

    if (!record) {
      return { success: false, error: 'No active OTP found. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      this.otps.delete(cleanEmail);
      return { success: false, error: 'OTP has expired. Please request a new code.' };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      this.otps.delete(cleanEmail);
      return { success: false, error: 'Too many invalid attempts. Please request a new code.' };
    }

    const providedHash = this.hashOtp(cleanEmail, providedOtp.trim());
    if (providedHash !== record.hash) {
      return { success: false, error: 'Invalid 6-digit verification code.' };
    }

    // Success -> purge OTP
    this.otps.delete(cleanEmail);
    return { success: true };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, val] of this.otps.entries()) {
      if (now > val.expiresAt) {
        this.otps.delete(key);
      }
    }
    for (const [key, val] of this.rateLimits.entries()) {
      if (now > val.resetAt) {
        this.rateLimits.delete(key);
      }
    }
  }
}

export const emailOtpStore = new EmailOtpStore();
