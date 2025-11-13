import Redis from 'ioredis';
import crypto from 'crypto';
import { NetsCoreConfig } from '../types';

let redisInstance: Redis | null = null;

export const initializeRedis = (config?: NetsCoreConfig['redis']): Redis => {
  const options = {
    host: config?.host || 'localhost',
    port: config?.port || 6379,
    password: config?.password,
    db: config?.db || 0,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };

  redisInstance = new Redis(options);

  redisInstance.on('error', err => {
    console.error('Redis error:', err);
  });

  redisInstance.on('connect', () => {
    console.log('Redis connected');
  });

  return redisInstance;
};

export const getRedis = (): Redis => {
  if (!redisInstance) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return redisInstance;
};

export const closeRedis = async (): Promise<void> => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
};

export class SecureCache {
  private keyPrefix = 'NETS_SK_';

  constructor(
    private redis: Redis,
    private secretKey: string
  ) {}

  private secureKey(key: string): string {
    const hash = crypto.createHmac('sha256', this.secretKey).update(key).digest('hex');

    const fullKey = `${this.keyPrefix}${hash}`;
    return fullKey.substring(0, 250);
  }

  private secureValue(value: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(value).digest('hex');
  }

  async set(key: string, value: string, expirationSeconds: number): Promise<void> {
    const securedKey = this.secureKey(key);
    const securedValue = this.secureValue(value);
    await this.redis.setex(securedKey, expirationSeconds, securedValue);
  }

  async get(key: string): Promise<string | null> {
    const securedKey = this.secureKey(key);
    return await this.redis.get(securedKey);
  }

  async delete(key: string): Promise<void> {
    const securedKey = this.secureKey(key);
    await this.redis.del(securedKey);
  }

  validate(storedValue: string | null, valueToCheck: string): boolean {
    if (!storedValue) return false;
    return this.secureValue(valueToCheck) === storedValue;
  }
}
