import { Request, Response, NextFunction } from 'express';

export function validateEval(req: Request, res: Response, next: NextFunction) {
    const { userId, flagKey, attributes } = req.body;

    if (typeof userId !== 'string' || typeof flagKey !== 'string') {
        return res.status(400).json({ error: 'invalid body shape' });
    }
    if (!userId.trim().length || !flagKey.trim().length) {
        return res.status(400).json({ error: 'invalid values' });
    }
    // != null is a soft check so undefined handeled too :)
    if (attributes != null && typeof attributes !== 'object') {
        return res.status(400).json({ error: 'invalid attributes' });
    }
    next();
}
