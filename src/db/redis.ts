import { createClient } from 'redis';
import { REDIS_URL } from '../config/db.js';

export const redis = createClient({
    url: REDIS_URL,
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

redis.on('end', () => {
    console.log('Redis connection closed');
    isConnected = false;
});

let isConnected = false;

export async function connectRedis(): Promise<void> {
    if (isConnected) return;

    await redis.connect();
    isConnected = true;
}
