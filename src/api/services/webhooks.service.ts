import { WebhookPayload } from '@flagforge/types';
import crypto from 'crypto';
import { deleteWebhookRowForUser, getWebhookRowsByEnvAndEvent, getWebhookRowsForUser, insertWebhookRowForUser } from '../../db/webhook.db.js';
import { webhookQueue } from '../../workers/webhook.queue.js';

export async function createWebhookForUser(userId: string, envId: string, url: string, events: string[]) {
    const secret = crypto.randomBytes(32).toString('hex');

    return await insertWebhookRowForUser(userId, envId, url, secret, events);
}

export async function listWebhooksForUser(userId: string, envId: string) {
    return await getWebhookRowsForUser(userId, envId);
}

export async function deleteWebhookForUser(userId: string, webhookId: string) {
    // optional existence check could be added later
    await deleteWebhookRowForUser(userId, webhookId);
}

export async function enqueueWebhookJobs(payload: WebhookPayload) {
    const webhooks = await getWebhookRowsByEnvAndEvent(payload.environmentId, payload.event);

    if (webhooks.length === 0) return;

    const jobs = webhooks.map((wh) => ({
        name: 'deliver',
        data: {
            webhookId: wh.id,
            url: wh.url,
            secret: wh.secret,
            payload,
        },
    }));

    await webhookQueue.addBulk(jobs);
}
