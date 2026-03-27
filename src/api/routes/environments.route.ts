import { Router } from 'express';
import { listWebhooksHandler, createWebhookHandler } from '../controllers/webhooks.controller.js';
import { validateCreateWebhook } from '../middleware/validateCreateWebhook.js';
import { validateEnvId } from '../middleware/validateEnvId.js';
import { rotateEnvSdkKeyHandler } from '../controllers/environments.controller.js';

const environmentRouter = Router();

environmentRouter.post('/:envId/sdk-key/rotate', validateEnvId, rotateEnvSdkKeyHandler);

environmentRouter.get('/:envId/webhooks', validateEnvId, listWebhooksHandler);
environmentRouter.post('/:envId/webhooks', validateCreateWebhook, createWebhookHandler);

export default environmentRouter;
