import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';
import { EMAIL_REGEX } from '../../shared/constants/regex.js';

export function validateRegister(req: Request, _res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
        throw new BadRequestError('Invalid email');
    }
    if (!password || typeof password !== 'string') {
        throw new BadRequestError('Invalid Password');
    }
    if (password.length < 6) {
        throw new BadRequestError('Password must be atleast 6 charactrs');
    }

    next();
}
