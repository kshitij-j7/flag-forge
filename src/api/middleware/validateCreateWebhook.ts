import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/BadRequestError.js';

const URL_REGEX = /^(https?:\/\/)((([a-zA-Z0-9\-.])+)\.([a-zA-Z]{2,}))(:\d+)?(\/.*)?$/;

export function validateCreateWebhook(req: Request, _res: Response, next: NextFunction) {
    const { url, events } = req.body;
    const { envId } = req.params;

    if (!envId) {
        throw new BadRequestError('Missing environmentId');
    }

    if (!url || typeof url !== 'string' || !URL_REGEX.test(url)) {
        throw new BadRequestError('Invalid url');
    }

    if (!Array.isArray(events) || events.length === 0) {
        throw new BadRequestError('Events must be a non-empty array');
    }

    for (const e of events) {
        if (typeof e !== 'string') {
            throw new BadRequestError('Invalid event type');
        }
    }

    next();
}
