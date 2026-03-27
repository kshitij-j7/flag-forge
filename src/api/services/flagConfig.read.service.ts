import { FlagConfig } from '@flagforge/types';
import { getFlagConfigCache, setFlagConfigCache } from '../../cache/flagConfig.cache.js';
import { pool } from '../../db/index.js';
import { compileDbRowToFlagConfig } from '../../loader/flagConfig.loader.js';
import { getFlagRowByIdForUser } from '../../db/flag.db.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { InvariantError } from '../errors/InvariantError.js';
import { getFlagConfigRowByKey, getFlagConfigRowByKeyForUser, getFlagConfigRowsByKeys } from '../../db/flagConfig.db.js';

export async function getFlagConfigByKey(envId: string, flagKey: string): Promise<FlagConfig> {
    const flagConfig = await _getFlagConfigByKey(envId, flagKey);
    if (!flagConfig) {
        throw new NotFoundError(`Flag doesn't exist for given key`);
    }
    return flagConfig;
}

export async function getFlagConfigByIdForUser(userId: string, envId: string, flagId: string): Promise<FlagConfig> {
    const flag = await getFlagRowByIdForUser(pool, userId, flagId);
    if (!flag) {
        throw new NotFoundError(`Flag doesn't exist for given id`);
    }
    const row = await getFlagConfigRowByKeyForUser(pool, userId, envId, flag.key);
    if (!row) {
        throw new InvariantError(`Flag config missing for flagId=${flagId}`);
    }
    return compileDbRowToFlagConfig(row);
}

export async function getFlagConfigBatch(envId: string, flagKeys: string[]): Promise<Map<string, FlagConfig>> {
    const result = new Map<string, FlagConfig>();

    // 1. cache lookup
    const cacheHits = await Promise.all(
        flagKeys.map(async (key) => ({
            key,
            value: await getFlagConfigCache(envId, key),
        })),
    );
    const missingKeys: string[] = [];
    for (const { key, value } of cacheHits) {
        if (value) {
            result.set(key, value);
        } else {
            missingKeys.push(key);
        }
    }
    // 2. DB fetch for misses // DB only for missingKeys → smaller IN (...) / ANY (...) → DB query becomes faster
    if (missingKeys.length > 0) {
        const rows = await getFlagConfigRowsByKeys(pool, envId, missingKeys);

        for (const row of rows) {
            const compiled = compileDbRowToFlagConfig(row);
            result.set(row.key, compiled);

            setFlagConfigCache(envId, row.key, compiled).catch(console.error);
        }
    }
    return result;
}

async function _getFlagConfigByKey(envId: string, flagKey: string): Promise<FlagConfig | null> {
    const cached = await getFlagConfigCache(envId, flagKey);
    if (cached) return cached;
    const row = await getFlagConfigRowByKey(pool, envId, flagKey);
    if (!row) {
        return null;
    }
    const compiled = compileDbRowToFlagConfig(row);
    setFlagConfigCache(envId, flagKey, compiled).catch(console.error);
    return compiled;
}
