import { Response, Request, NextFunction } from 'express';
import { evaluateBatchService, evaluateService } from '../services/evaluation.service.js';

export async function evaluateHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const envId = req.envId!;
        const { userId, flagKey, attributes } = req.body;

        const result = await evaluateService({ envId, userId, flagKey, attributes });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function evaluateBatchHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const envId = req.envId!;
        const { userId, flagKeys, attributes } = req.body;

        const results = await evaluateBatchService({ envId, userId, flagKeys, attributes });
        res.json(results);
    } catch (err) {
        next(err);
    }
}
