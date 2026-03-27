import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateDeleteWebhook(req: Request, _res: Response, next: NextFunction) {
    const { webhookId } = req.params;

    if (!webhookId || typeof webhookId !== 'string' || !UUID_REGEX.test(webhookId)) {
        throw new BadRequestError('Invalid webhookId');
    }

    next();
}
