import { redis } from '../db/redis.js';

const PREFIX = 'sdkKey';

function key(sdkKey: string): string {
    return `${PREFIX}:${sdkKey}`;
}

const TTL_SECONDS = 60 * 10; // 10 mins

export async function getEnvIdFromCache(sdkKey: string): Promise<string | null> {
    const val = await redis.get(key(sdkKey));
    return val ?? null;
}

export async function setEnvIdCache(sdkKey: string, envId: string): Promise<void> {
    await redis.set(key(sdkKey), envId, {
        EX: TTL_SECONDS,
    });
}

export async function invalidateSdkKeyCache(sdkKey: string): Promise<void> {
    await redis.del(key(sdkKey));
}
