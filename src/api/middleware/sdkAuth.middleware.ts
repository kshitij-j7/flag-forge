import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { resolveEnvIdFromSdkKey } from '../services/environments.service.js';

export async function sdkAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
        const sdkKey = req.header('X-SDK-Key');
        if (!sdkKey) {
            throw new UnauthorizedError('Missing SDK key');
        }
        const envId = await resolveEnvIdFromSdkKey(sdkKey);
        req.envId = envId;
        next();
    } catch (err) {
        next(err);
    }
}
