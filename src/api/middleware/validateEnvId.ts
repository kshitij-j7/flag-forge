import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateEnvId(req: Request, _res: Response, next: NextFunction) {
    const { envId } = req.params;

    if (!envId || typeof envId !== 'string' || !UUID_REGEX.test(envId)) {
        throw new BadRequestError('Invalid environmentId');
    }

    next();
}
