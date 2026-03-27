import { pool } from './index.js';
import { QueryResult } from 'pg';

export interface IWebhookDbRow {
    id: string;
    environment_id: string;
    url: string;
    secret: string;
    events: string[];
    created_at: Date;
}

export async function insertWebhookRowForUser(
    userId: string,
    envId: string,
    url: string,
    secret: string,
    events: string[],
): Promise<IWebhookDbRow> {
    const query = `
        INSERT INTO webhooks (environment_id, url, secret, events)
        SELECT e.id, $3, $4, $5
        FROM environments e
        JOIN projects p ON p.id = e.project_id
        WHERE e.id = $2 AND p.user_id = $5
        RETURNING id, environment_id, url, secret, events, created_at
    `;

    const result: QueryResult<IWebhookDbRow> = await pool.query(query, [userId, envId, url, secret, events]);

    return result.rows[0];
}

export async function getWebhookRowsForUser(userId: string, envId: string): Promise<IWebhookDbRow[]> {
    const query = `
        SELECT wh.id, wh.environment_id, wh.url, wh.secret, wh.events, wh.created_at
        FROM webhooks wh
        JOIN environments e ON e.id = wh.environment_id
        JOIN projects p ON p.id = e.project_id AND p.user_id = $1
        WHERE wh.environment_id = $2
        ORDER BY wh.created_at DESC
    `;

    const result: QueryResult<IWebhookDbRow> = await pool.query(query, [userId, envId]);

    return result.rows;
}

export async function deleteWebhookRowForUser(userId: string, webhookId: string): Promise<void> {
    const query = `
        DELETE FROM webhooks w
        USING environments e, projects p
        WHERE w.id = $2
            AND w.environment_id = e.id
            AND e.project_id = p.id
            AND p.user_id = $1
    `;

    await pool.query(query, [userId, webhookId]);
}

export async function getWebhookRowsByEnvAndEvent(envId: string, event: string): Promise<IWebhookDbRow[]> {
    const query = `
        SELECT id, environment_id, url, secret, events, created_at
        FROM webhooks
        WHERE environment_id = $1 AND $2 = ANY(events)
    `;

    const result: QueryResult<IWebhookDbRow> = await pool.query(query, [envId, event]);

    return result.rows;
}
