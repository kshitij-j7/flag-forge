import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

export function validateCreateProject(req: Request, _res: Response, next: NextFunction) {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new BadRequestError('Invalid project name');
    }

    next();
}
