import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { JWT_SECRET } from '../../config/auth.js';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid token');
        }

        const token = authHeader.slice(7).trim();
        // authHeader: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

        const { payload } = await jwtVerify(token, JWT_SECRET);

        // attach to request (you already extended express types)
        req.userId = payload.sub as string;

        next();
    } catch (err) {
        console.error(err);
        return next(new UnauthorizedError('Unauthorized'));
    }
}
