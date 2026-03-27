import { FlagConfig } from '@flagforge/types';
import { redis } from '../db/redis.js';

const PREFIX = 'flagConfig';

function key(envId: string, flagKey: string): string {
    return `${PREFIX}:${envId}:${flagKey}`;
}

const TTL_SECONDS = 60 * 5; // 5 min

export async function getFlagConfigCache(envId: string, flagKey: string): Promise<FlagConfig | null> {
    const data = await redis.get(key(envId, flagKey));
    if (!data) return null;

    try {
        return JSON.parse(data) as FlagConfig;
    } catch {
        return null; // fail-safe
    }
}

export async function setFlagConfigCache(envId: string, flagKey: string, value: FlagConfig): Promise<void> {
    const k = key(envId, flagKey);
    const payload = JSON.stringify(value);

    if (TTL_SECONDS) {
        await redis.set(k, payload, { EX: TTL_SECONDS });
    } else {
        await redis.set(k, payload);
    }
}

export async function invalidateFlagConfigCache(envId: string, flagKey: string): Promise<void> {
    await redis.del(key(envId, flagKey));
}
