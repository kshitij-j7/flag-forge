import { Router } from 'express';
import { validateUpsertFlagConfig } from '../middleware/validateUpsertFlagConfig.js';
import { validateToggleFlagConfig } from '../middleware/validateToggleFlagConfig.js';
import { validateGetAnalytics } from '../middleware/validateGetAnalytics.js';
import { getAuditLogsHandler } from '../controllers/audit.controller.js';
import { validateGetAudit } from '../middleware/validateGetAudit.js';
import { validateGetFlagConfig } from '../middleware/validateGetFlagConfig.js';
import { getAnalyticsHandler } from '../controllers/analytics.controller.js';
import {
    upsertFlagConfigHandler,
    getFlagConfigHandler,
    toggleFlagConfigHandler,
} from '../controllers/flagConfig.controller.js';

const flagRouter = Router();
// warm path
flagRouter.put('/:flagId/config/:envId', validateUpsertFlagConfig, upsertFlagConfigHandler);
flagRouter.get('/:flagId/config/:envId', validateGetFlagConfig, getFlagConfigHandler);
flagRouter.patch('/:flagId/config/:envId/toggle', validateToggleFlagConfig, toggleFlagConfigHandler);

// cold path
    flagRouter.get('/:flagId/analytics/:envId', validateGetAnalytics, getAnalyticsHandler);
    flagRouter.get('/:flagId/audit', validateGetAudit, getAuditLogsHandler);

export default flagRouter;
