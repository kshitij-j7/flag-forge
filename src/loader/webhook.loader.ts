import { Webhook } from '@flagforge/types';
import { IWebhookDbRow } from '../db/webhook.db.js';

export function compileDbRowToWebhook(row: IWebhookDbRow): Webhook {
    return {
        url: row.url,
        environmentId: row.environment_id,
        secret: row.secret,
        events: row.events,
        createdAt: row.created_at,
    };
}
