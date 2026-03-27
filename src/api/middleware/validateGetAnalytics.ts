import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

export function validateGetAnalytics(req: Request, _res: Response, next: NextFunction) {
    const { flagId, envId } = req.params;

    if (!flagId || !envId) {
        throw new BadRequestError('flagId and envId are required');
    }

    next();
}
