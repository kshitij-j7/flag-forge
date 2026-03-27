import { Request, Response, NextFunction } from 'express';
import { register, login } from '../services/auth.service.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        const result = await register(email, password);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
