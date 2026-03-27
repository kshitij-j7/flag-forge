import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

export function validateListProjects(req: Request, _res: Response, next: NextFunction) {
    const { limit, offset } = req.query;

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
