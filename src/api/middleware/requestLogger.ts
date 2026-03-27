import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        console.log(
            JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                duration_ms: duration,
                userId: req.userId ?? null,
                envId: req.envId ?? null,
                body: req.body,
            }),
        );
    });

    next();
}
