import { IStore } from './IStore.js';
import { MemoryStore } from './MemoryStore.js';
import { RedisStore } from './RedisStore.js';
import { CONFIG } from '../config.js';

let storeInstance: IStore;

if (CONFIG.REDIS_URL) {
  console.log('[Store] Initializing RedisStore with URL:', CONFIG.REDIS_URL);
  const redisStore = new RedisStore(CONFIG.REDIS_URL);
  redisStore.connect().catch((err) => {
    console.error('[Store] Redis connection failed, falling back to MemoryStore:', err.message);
  });
  storeInstance = redisStore;
} else {
  console.log('[Store] Initializing in-memory TTL ephemeral store');
  storeInstance = new MemoryStore();
}

export const store = storeInstance;
