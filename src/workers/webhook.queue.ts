import { Queue } from 'bullmq';
import { bullmqConnection } from '../db/bullmq.redis.js';
import { WebhookPayload } from '@flagforge/types';

export interface WebhookJob {
    webhookId: string;
    url: string;
    secret: string;
    payload: WebhookPayload;
}

export const webhookQueue = new Queue<WebhookJob>('webhook-delivery', {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
    },
});
