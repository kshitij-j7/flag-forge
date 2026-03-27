import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    const status = err instanceof AppError ? err.status : 500;
    const message = err instanceof AppError ? err.message : 'internal error';

    console.error(
        JSON.stringify({
            message: err.message,
            status,
            path: req.originalUrl,
            method: req.method,
            userId: req.userId ?? null,
            envId: req.envId ?? null,
            stack: err.stack,
        }),
    );

    return res.status(status).json({ error: message });
}
