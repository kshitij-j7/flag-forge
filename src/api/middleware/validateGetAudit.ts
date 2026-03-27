import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateGetAudit(req: Request, _res: Response, next: NextFunction) {
    const { flagId } = req.params;
    const { limit, offset } = req.query;

    if (!flagId || typeof flagId !== 'string' || !UUID_REGEX.test(flagId)) {
        throw new BadRequestError('Invalid flagId');
    }

    if (limit !== undefined) {
        const l = Number(limit);
        if (Number.isNaN(l) || l <= 0) {
            throw new BadRequestError('Invalid limit');
        }
    }

    if (offset !== undefined) {
        const o = Number(offset);
        if (Number.isNaN(o) || o < 0) {
            throw new BadRequestError('Invalid offset');
        }
    }

    next();
}
