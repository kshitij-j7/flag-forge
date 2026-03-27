import { Router } from 'express';
import { deleteWebhookHandler } from '../controllers/webhooks.controller.js';
import { validateDeleteWebhook } from '../middleware/validateDeleteWebhook.js';

const webhooksRouter = Router();

webhooksRouter.delete('/:webhookId', validateDeleteWebhook, deleteWebhookHandler);

export default webhooksRouter;
