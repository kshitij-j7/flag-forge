import { FlagConfig, Rule, Targeting, Variant } from '@flagforge/types';
import { getFlagConfigRowForUpdateForUser, toggleFlagConfigRow, upsertFlagConfigRowForUser } from '../../db/flagConfig.db.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { withTransaction } from '../../db/transaction.js';
import { pool } from '../../db/index.js';
import { compileDbRowToFlagConfig } from '../../loader/flagConfig.loader.js';
import { writeAuditLog } from './audit.service.js';
import { redis } from '../../db/redis.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { getFlagRowByIdForUser } from '../../db/flag.db.js';
import { InvariantError } from '../errors/InvariantError.js';
import { enqueueWebhookJobs } from './webhooks.service.js';

export async function upsertFlagConfig(
    userId: string,
    flagId: string,
    envId: string,
    data: {
        enabled: boolean;
        variants: Variant[];
        rules: Rule[];
        targeting: Targeting;
        defaultVariant: string;
    },
): Promise<{
    isUpdated: boolean;
    data: FlagConfig;
}> {
    validateWeights(data.variants);

    const { before, after } = await withTransaction(async (client) => {
        const current = await getFlagConfigRowForUpdateForUser(client, userId, envId, flagId);

        if (current && current.enabled) {
            const changed = !areVariantsEqual(current.variants, data.variants);
            if (changed) {
                throw new BadRequestError(`Variants can't be changed for active flags`);
            }
        }

        const updated = await upsertFlagConfigRowForUser(client, userId, envId, flagId, data);

        return {
            before: current ?? null,
            after: updated,
        };
    });

    if (!after) {
        throw new NotFoundError('Invalid flagId or EnvId');
    }
    const flagRow = await getFlagRowByIdForUser(pool, userId, after.flag_id);
    if (!flagRow) {
        throw new InvariantError(`Flag exists for id: ${after.flag_id} in flagConfig table but getFlagRowByIdForUser returned null`);
    }
    const flagKey = flagRow.key;

    // side-effects (outside txn)
    await writeAuditLog({
        flagConfigId: after.id,
        actor: userId,
        action: 'UPSERT',
        before,
        after,
    });

    await redis.publish(`flag:updates:${envId}`, JSON.stringify({ flagKey }));

    await enqueueWebhookJobs({
        event: 'flag.updated',
        environmentId: envId,
        timestamp: new Date().toISOString(),
        flagKey,
        before,
        after,
        actor: userId,
    });

    return {
        isUpdated: !!before,
        data: compileDbRowToFlagConfig({ ...after, key: flagKey }),
    };
}

export async function toggleFlagConfig(userId: string, flagId: string, envId: string, enabled: boolean) {
    const { before, after } = await withTransaction(async (client) => {
        const before = await getFlagConfigRowForUpdateForUser(pool, userId, envId, flagId);
        const after = await toggleFlagConfigRow(pool, userId, envId, flagId, enabled);
        return { before, after };
    });

    if (!after) {
        throw new NotFoundError('Invalid flagId or EnvId');
    }
    const flagRow = await getFlagRowByIdForUser(pool, userId, after.flag_id);
    if (!flagRow) {
        throw new InvariantError(`Flag exists for id: ${after.flag_id} in flagConfig table but getFlagRowByIdForUser returned null`);
    }
    const flagKey = flagRow.key;

    await writeAuditLog({
        flagConfigId: after.id,
        actor: userId,
        action: 'TOGGLE',
        before,
        after,
    });

    await redis.publish(`flag:updates:${envId}`, JSON.stringify({ flagKey }));

    await enqueueWebhookJobs({
        event: 'flag.updated',
        environmentId: envId,
        timestamp: new Date().toISOString(),
        flagKey,
        before,
        after,
        actor: userId,
    });

    return compileDbRowToFlagConfig({ ...after, key: flagKey });
}

/* ---------- utils ---------- */

function validateWeights(variants: Variant[]) {
    const total = variants.reduce((sum, v) => sum + v.weight, 0);
    if (total !== 100000) {
        throw new BadRequestError('Variant weight must sum to 100,000');
    }
}

function normalizeVariants(v: Variant[]): Variant[] {
    return [...v].sort((a, b) => a.key.localeCompare(b.key));
}

function areVariantsEqual(a: Variant[], b: Variant[]): boolean {
    return JSON.stringify(normalizeVariants(a)) === JSON.stringify(normalizeVariants(b));
}
