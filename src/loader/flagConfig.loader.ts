import { FlagConfig } from '@flagforge/types';
import { FlagConfigWithKeyDbRow } from '../db/flagConfig.db.js';
import { compileVariants } from '../engine/compileVariants.js';

export function compileDbRowToFlagConfig(row: FlagConfigWithKeyDbRow): FlagConfig {
    return {
        flagId: row.flag_id,
        key: row.key,
        enabled: row.enabled,
        compiledVariants: compileVariants(row.variants),
        defaultVariant: row.default_variant,
        rules: row.rules,
        version: row.version,
        targeting: row.targeting,
    };
}
