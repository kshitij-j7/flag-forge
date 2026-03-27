import { Request, Response, NextFunction } from 'express';
import { getAnalyticsForUser } from '../services/analytics.service.js';

export async function getAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { flagId, envId } = req.params as { flagId: string; envId: string };
        const userId = req.userId!;

        const data = await getAnalyticsForUser(userId, envId, flagId);

        res.json(data);
    } catch (err) {
        next(err);
    }
}
