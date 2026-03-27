import { Request, Response, NextFunction } from 'express';
import { redis } from '../../db/redis.js';

export async function evalRateLimit(req: Request, res: Response, next: NextFunction) {
    const key = `rl:${req.envId}`; // per environment

    const limit = 100; // requests
    const window = 60; // seconds

    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, window);
    }

    if (count > limit) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    next();
}
