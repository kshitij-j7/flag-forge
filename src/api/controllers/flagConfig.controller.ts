import { NextFunction, Request, Response } from 'express';
import { toggleFlagConfig, upsertFlagConfig } from '../services/flagConfig.write.service.js';
import { Rule, Targeting, Variant } from '@flagforge/types';
import { getFlagConfigByIdForUser } from '../services/flagConfig.read.service.js';

export async function upsertFlagConfigHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const flagId = req.params.flagId as string;
        const envId = req.params.envId as string;
        const userId = req.userId!;

        const { enabled, variants, rules, targeting, defaultVariant } = req.body as {
            enabled: boolean;
            variants: Variant[];
            rules: Rule[];
            targeting: Targeting;
            defaultVariant: string;
        };

        const config = await upsertFlagConfig(userId, flagId, envId, {
            enabled,
            variants,
            rules,
            targeting,
            defaultVariant,
        });

        res.status(200).json(config); // Not revealing update/insert
    } catch (err: any) {
        next(err);
    }
}

export async function toggleFlagConfigHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const flagId = req.params.flagId as string;
        const envId = req.params.envId as string;
        const { enabled } = req.body as { enabled: boolean };
        const actor = req.userId;

        const config = await toggleFlagConfig(flagId, envId, actor!, enabled);
        return res.json(config);
    } catch (err: any) {
        next(err);
    }
}

export async function getFlagConfigHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { flagId, envId } = req.params as { flagId: string; envId: string };
        const userId = req.userId!;

        const config = await getFlagConfigByIdForUser(userId, envId, flagId);

        return res.json(config);
    } catch (err) {
        next(err);
    }
}
