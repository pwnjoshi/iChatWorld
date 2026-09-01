import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  REDIS_URL: process.env.REDIS_URL || '',
  FACULTY_PASSPHRASE: process.env.FACULTY_PASSPHRASE || 'faculty123',
  ROOM_INACTIVITY_TTL_SEC: 6 * 60 * 60, // 6 hours
  ROOM_HARD_CAP_SEC: 24 * 60 * 60,     // 24 hours
  MAX_MESSAGES_PER_ROOM: 200,
  MAX_RELAY_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB max for relay
  RELAY_FILE_PURGE_MS: 15 * 60 * 1000, // 15 minutes max retention for relay chunks
  NEBIUS_API_KEY: process.env.NEBIUS_API_KEY || '',
  NEBIUS_BASE_URL: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.us-central1.nebius.com/v1/',
  NEBIUS_MODEL: process.env.NEBIUS_MODEL || 'deepseek-ai/DeepSeek-V4-Flash',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'iChatWorld <onboarding@resend.dev>'
};
