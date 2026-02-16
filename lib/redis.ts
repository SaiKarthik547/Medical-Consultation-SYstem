import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Enable offline queue for resilience
    enableOfflineQueue: true,
    // Connection timeout
    connectTimeout: 10000,
    // Keep alive
    keepAlive: 30000,
};

// Create Redis client singleton
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis =
    globalForRedis.redis ??
    new Redis(redisConfig);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Redis event handlers
redis.on('connect', () => {
    console.log('✅ Redis connected');
});

redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

redis.on('ready', () => {
    console.log('✅ Redis ready');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await redis.quit();
});

export default redis;
