import { Worker } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { bullmqConnection } from '../db/bullmq.redis.js';
import { WebhookJob } from './webhook.queue.js';

function signPayload(payload: any, secret: string): string {
    const body = JSON.stringify(payload);

    return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export const webhookWorker = new Worker<WebhookJob>(
    'webhook-delivery',
    async (job) => {
        const { url, payload, secret } = job.data;

        const body = JSON.stringify(payload);
        const signature = signPayload(payload, secret);

        const res = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'x-flagforge-signature': signature,
            },
            timeout: 5000,
            validateStatus: () => true, // handle manually
        });

        if (res.status < 200 || res.status >= 300) {
            throw new Error(`Webhook failed with status ${res.status}`);
        }
    },
    {
        connection: bullmqConnection,
    },
);
