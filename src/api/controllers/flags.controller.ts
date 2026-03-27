import { NextFunction, Request, Response } from 'express';
import { createFlagForUser, getFlagsForUser } from '../services/flags.service.js';

export async function createFlagHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const projectId = req.params.projectId as string;
        const { key } = req.body as { key: string };
        const userId = req.userId!;

        const flag = await createFlagForUser(userId, projectId, key);
        res.status(201).json(flag);
    } catch (err: any) {
        return next(err);
    }
}

export async function listFlagsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const projectId = req.params.projectId as string;
        const userId = req.userId!;
        const flags = await getFlagsForUser(userId, projectId);
        res.status(201).json(flags);
    } catch (err) {
        next(err);
    }
}
