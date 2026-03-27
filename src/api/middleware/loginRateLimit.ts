import { Request, Response, NextFunction } from 'express';
import { redis } from '../../db/redis.js';
import { TooManyRequestsError } from '../errors/TooManyRequestsError.js';
import { LOGIN_RATE_LIMIT_WINDOW, EMAIL_LIMIT, IP_LIMIT } from '../../shared/constants/auth.js';

export async function loginRateLimit(req: Request, _res: Response, next: NextFunction) {
    try {
        const email = typeof req.body?.email === 'string' ? req.body.email : null;
        const ip = req.ip;

        const emailKey = `login:email:${email}`;
        const ipKey = `login:ip:${ip}`;

        // run atomically
        type RedisReply = [Error | null, number];
        const results = (await redis
            .multi()
            .incr(emailKey)
            .ttl(emailKey)
            .incr(ipKey)
            .ttl(ipKey)
            .exec()) as unknown as RedisReply[]; // We have to do this because of strict TS checking and lack of type conversion

        // INCR and EXPIRE are not atomic here, small window exists between INCR → EXPIRE
        // failure case:
        // INCR runs → key created  =>  TTL checked → -1 (no expiry yet)  =>  process crashes BEFORE EXPIRE (due to any reason)
        // result:
        // key exists in Redis WITHOUT expiry (TTL = -1) if no further requests come → key never expires
        // impact:
        // not a correctness issue (rate limiting still works) but can cause stale keys → memory buildup over time

        if (!results) {
            console.error('[RATE LIMITER] Redis exec failed');
            return next();
        }

        const emailCount = results[0][1] as number;
        const emailTTL = results[1][1] as number;
        const ipCount = results[2][1] as number;
        const ipTTL = results[3][1] as number;

        // set expiry ONLY if not set [-1 → key exists BUT has no expiry, -2 → key does not exist, >=0 → seconds remaining]
        if (emailTTL === -1) await redis.expire(emailKey, LOGIN_RATE_LIMIT_WINDOW);
        if (ipTTL === -1) await redis.expire(ipKey, LOGIN_RATE_LIMIT_WINDOW);

        if (emailCount > EMAIL_LIMIT || ipCount > IP_LIMIT) {
            return next(new TooManyRequestsError('Too many login attempts'));
        }

        next();
    } catch (err) {
        next(err);
    }
}
