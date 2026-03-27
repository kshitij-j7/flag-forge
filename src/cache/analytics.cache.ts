import { redis } from '../db/redis.js';

function key(flagId: string, envId: string): string {
    return `analytics:${flagId}:${envId}`;
}

// Increment variant count
export async function incrEval(flagId: string, envId: string, variantKey: string): Promise<void> {
    await redis.hIncrBy(key(flagId, envId), variantKey, 1);
}

// Get all variant counts
export async function getEvalCounts(flagId: string, envId: string): Promise<Record<string, number>> {
    const data = await redis.hGetAll(key(flagId, envId));

    const result: Record<string, number> = {};
    for (const k in data) {
        result[k] = Number(data[k]);
    }

    return result;
}
