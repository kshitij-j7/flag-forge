import { Request, Response, NextFunction } from 'express';

export function validateEvalBatch(req: Request, res: Response, next: NextFunction) {
    const { userId, envId, flagKeys, attributes } = req.body;

    if (typeof userId !== 'string' || typeof envId !== 'string' || !Array.isArray(flagKeys)) {
        return res.status(400).json({ error: 'invalid body shape' });
    }
    if (!userId.trim().length || !envId.trim().length) {
        return res.status(400).json({ error: 'invalid userId or envId' });
    }
    if (flagKeys.length === 0) {
        return res.status(400).json({ error: 'flagKeys cannot be empty' });
    }
    for (const key of flagKeys) {
        if (typeof key !== 'string' || !key.trim().length) {
            return res.status(400).json({ error: 'invalid flagKeys' });
        }
    }
    // != null is a soft check so undefined handeled too :)
    if (attributes != null && typeof attributes !== 'object') {
        return res.status(400).json({ error: 'invalid attributes' });
    }

    next();
}
