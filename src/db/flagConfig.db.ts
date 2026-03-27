import { Rule, Targeting, Variant } from '@flagforge/types';
import { DB } from './types.js';

export type FlagConfigDbRow = {
    id: string;
    flag_id: string;
    environment_id: string;
    project_id: string;
    enabled: boolean;
    variants: Variant[];
    rules: Rule[];
    targeting: Targeting;
    default_variant: string;
    version: number;
    // updated_at: Date; No use as of now
};

export type FlagConfigWithKeyDbRow = FlagConfigDbRow & {
    key: string;
};

export async function getFlagConfigRowByKey(db: DB, envId: string, flagKey: string): Promise<FlagConfigWithKeyDbRow | null> {
    const res = await db.query<FlagConfigWithKeyDbRow>(
        `
            SELECT fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version, f.key
            FROM flags f
            JOIN flag_configs fc ON fc.flag_id = f.id AND fc.environment_id = $1
            WHERE f.key = $2
            LIMIT 1
        `, // LIMIT 1 to avoid extra scanning
        [envId, flagKey],
    );
    return res.rows[0] ?? null;
}

export async function getFlagConfigRowsByKeys(db: DB, envId: string, flagKeys: string[]): Promise<FlagConfigWithKeyDbRow[]> {
    const res = await db.query<FlagConfigWithKeyDbRow>(
        `
            SELECT fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version, f.key
            FROM flags f
            JOIN flag_configs fc ON fc.flag_id = f.id AND fc.environment_id = $1
            WHERE f.key = ANY($2)
        `,
        [envId, flagKeys],
    );
    return res.rows;
}

export async function getFlagConfigRowByKeyForUser(
    db: DB,
    userId: string,
    envId: string,
    flagKey: string,
): Promise<FlagConfigWithKeyDbRow | null> {
    const res = await db.query<FlagConfigWithKeyDbRow>(
        `
            SELECT fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version, f.key
            FROM flags f
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            JOIN flag_configs fc ON fc.flag_id = f.id AND fc.environment_id = $2
            WHERE f.key = $3
            LIMIT 1
        `, // LIMIT 1 to avoid extra scanning
        [userId, envId, flagKey],
    );
    return res.rows[0] ?? null;
}

export async function getFlagConfigRowsForUser(db: DB, userId: string, envId: string, flagKeys: string[]): Promise<FlagConfigWithKeyDbRow[]> {
    if (flagKeys.length === 0) return [];
    const res = await db.query<FlagConfigWithKeyDbRow>(
        `
            SELECT fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version, f.key
            FROM flags f
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            JOIN flag_configs fc ON fc.flag_id = f.id AND fc.environment_id = $2
            WHERE f.key = ANY($3)
        `,
        [userId, envId, flagKeys],
    );
    return res.rows;
}

export async function getProjectIdFromFlagEnvForUser(db: DB, userId: string, envId: string, flagId: string): Promise<string | null> {
    const res = await db.query<{ project_id: string }>(
        `
            SELECT f.project_id
            FROM flags f
            JOIN environments e ON e.id = $2 AND e.project_id = f.project_id
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            WHERE f.id = $3
            LIMIT 1
        `,
        [userId, envId, flagId],
    );

    return res.rows[0]?.project_id ?? null;
}

export async function getFlagConfigRowForUpdateForUser(db: DB, userId: string, envId: string, flagId: string): Promise<FlagConfigDbRow | null> {
    const res = await db.query<FlagConfigDbRow>(
        // only fc is target in final SELECT hence f and p won't get blocked for update
        `
            SELECT fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version
            FROM flags f
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            JOIN flag_configs fc ON fc.flag_id = f.id AND fc.environment_id = $3
            WHERE f.id = $2
            LIMIT 1
            FOR UPDATE
        `, // db guarantees flag_config doesn't get flag and env of different project
        [userId, flagId, envId],
    );
    return res.rows[0] ?? null;
}

// complex queries + strong guarantees >>> simple code + weak guarantees
export async function upsertFlagConfigRowForUser(
    db: DB,
    userId: string,
    envId: string,
    flagId: string,
    data: {
        enabled: boolean;
        variants: Variant[];
        rules: Rule[];
        targeting: Targeting;
        defaultVariant: string;
    },
): Promise<FlagConfigDbRow | null> {
    const { enabled, variants, rules, targeting, defaultVariant } = data;

    console.log('isArray:', Array.isArray(variants));
    console.log('first type:', typeof variants[0]);

    const res = await db.query<FlagConfigDbRow>(
        `
            INSERT INTO flag_configs (flag_id, environment_id, project_id, enabled, variants, rules, targeting, default_variant)
            SELECT f.id, e.id, f.project_id, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8
            FROM flags f
            JOIN environments e ON e.id = $3 AND e.project_id = f.project_id
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            WHERE f.id = $2

            ON CONFLICT (flag_id, environment_id)
            DO UPDATE SET
                enabled = EXCLUDED.enabled,
                variants = EXCLUDED.variants,
                rules = EXCLUDED.rules,
                targeting = EXCLUDED.targeting,
                default_variant = EXCLUDED.default_variant
            WHERE flag_configs.project_id = (
                SELECT f.project_id
                FROM flags f
                JOIN projects p ON p.id = f.project_id AND p.user_id = $1
                WHERE f.id = $2
            )
            RETURNING id, flag_id, environment_id, project_id, enabled, variants, rules, targeting, default_variant, version
        `, // RETURNING of INSERT / UPDATE only returns the main table content!! can't add column of another table like f.key
        [userId, flagId, envId, enabled, JSON.stringify(variants ?? []), JSON.stringify(rules ?? []), targeting ?? {}, defaultVariant],
    );
    return res.rows[0] ?? null;
}

export async function toggleFlagConfigRow(
    db: DB,
    userId: string,
    envId: string,
    flagId: string,
    enabled: boolean,
): Promise<FlagConfigDbRow | null> {
    const res = await db.query<FlagConfigDbRow>(
        `
            UPDATE flag_configs fc
            SET enabled = $4
            FROM flags f
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            WHERE fc.flag_id = f.id AND f.id = $2 AND fc.environment_id = $3
            RETURNING fc.id, fc.flag_id, fc.environment_id, fc.project_id, fc.enabled, fc.variants, fc.rules, fc.targeting, fc.default_variant, fc.version
        `, // Bring in flags as a reference table to enforce relationships and ownership constraints: """FROM flags f JOIN projects p"""
        [userId, flagId, envId, enabled],
        // Here WHERE fc.flag_id = f.id automatically JOIN fc with f to perform check ""fc.flag_id = f.id""
    );
    return res.rows[0] ?? null;
}
