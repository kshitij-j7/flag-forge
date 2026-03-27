import { Rule, Variant } from '@flagforge/types';
import { Request, Response, NextFunction } from 'express';

/**
 * Strict validation for flag config write
 * This is CRITICAL — protects system correctness
 */

export function validateUpsertFlagConfig(req: Request, res: Response, next: NextFunction) {
    const { flagId, envId } = req.params;

    const { enabled, variants, rules, targeting, defaultVariant } = req.body;

    // ---- params ----
    if (typeof flagId !== 'string' || !flagId.trim()) {
        return res.status(400).json({ error: 'invalid flagId' });
    }
    if (typeof envId !== 'string' || !envId.trim()) {
        return res.status(400).json({ error: 'invalid envId' });
    }
    // ---- enabled ----
    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be boolean' });
    }
    // ---- variants ----
    if (!Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ error: 'variants must be non-empty array' });
    }
    for (const v of variants as Variant[]) {
        if (!v || typeof v.key !== 'string' || typeof v.weight !== 'number') {
            return res.status(400).json({ error: 'invalid variant shape' });
        }
        if (v.weight < 0) {
            return res.status(400).json({ error: 'variant weight must be >= 0' });
        }
    }
    // ---- rules ----
    if (rules !== undefined) {
        if (!Array.isArray(rules)) {
            return res.status(400).json({ error: 'rules must be array' });
        }

        for (const r of rules as Rule[]) {
            if (!r || typeof r.attribute !== 'string' || typeof r.op !== 'string' || r.value === undefined || typeof r.variant !== 'string') {
                return res.status(400).json({ error: 'invalid rule shape' });
            }
        }
    }

    // ---- targeting ----
    if (targeting !== undefined) {
        if (!Array.isArray(targeting)) {
            return res.status(400).json({ error: 'targeting must be array' });
        }
        for (const t of targeting) {
            if (!t || typeof t.userId !== 'string' || typeof t.variant !== 'string') {
                return res.status(400).json({ error: 'invalid targeting shape' });
            }
        }
    }
    // ---- default_variant ----
    if (!defaultVariant || typeof defaultVariant !== 'string') {
        return res.status(400).json({ error: 'default_variant must be string' });
    }

    next();
}
