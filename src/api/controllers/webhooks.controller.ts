import { Request, Response, NextFunction } from 'express';
import { createWebhookForUser, listWebhooksForUser, deleteWebhookForUser } from '../services/webhooks.service.js';

export async function createWebhookHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { envId } = req.params as { envId: string };
        const { url, events } = req.body;
        const userId = req.userId!;

        const webhook = await createWebhookForUser(userId, envId, url, events);

        res.status(201).json(webhook);
    } catch (err) {
        next(err);
    }
}

export async function listWebhooksHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { envId } = req.params as { envId: string };
        const userId = req.userId!;

        const webhooks = await listWebhooksForUser(userId, envId);

        res.status(200).json(webhooks);
    } catch (err) {
        next(err);
    }
}

export async function deleteWebhookHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { webhookId } = req.params as { webhookId: string };
        const userId = req.userId!;

        await deleteWebhookForUser(userId, webhookId);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
