import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/BadRequestError.js';

export const validateGetFlagConfig = (req: Request, _res: Response, next: NextFunction) => {
    const schema = z.object({
        flagId: z.uuid(),
        envId: z.uuid(),
    });

    const result = schema.safeParse(req.params);

    if (!result.success) {
        return next(new BadRequestError('Invalid params'));
    }

    next();
};
