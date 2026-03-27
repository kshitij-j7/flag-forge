import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from '../services/audit.service.js';
import { validateFlagAccess } from '../services/authz.service.js';

export async function getAuditLogsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { flagId } = req.params as { flagId: string };
        const userId = req.userId!;

        validateFlagAccess(userId, flagId);

        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const offset = req.query.offset ? Number(req.query.offset) : undefined;

        const logs = await getAuditLogs(flagId, limit, offset);

        res.status(200).json(logs);
    } catch (err) {
        next(err);
    }
}
