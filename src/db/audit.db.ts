import { pool } from './index.js';
import { QueryResult } from 'pg';

export interface IAuditLogDbRow {
    id: string;
    flag_config_id: string;
    actor: string;
    action: string;
    before: any;
    after: any;
    created_at: string;
}

export async function insertAuditLog(input: {
    flagConfigId: string;
    actor: string;
    action: string;
    before: any;
    after: any;
}): Promise<void> {
    const query = `
        INSERT INTO audit_logs (flag_config_id, actor, action, before, after)
        VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [input.flagConfigId, input.actor, input.action, input.before, input.after]);
}

export async function listAuditLogs(flagId: string, limit = 20, offset = 0): Promise<IAuditLogDbRow[]> {
    const query = `
        SELECT al.id, al.flag_config_id, al.actor, al.action, al.before, al.after, al.created_at
        FROM audit_logs al
        JOIN flag_configs fc ON fc.id = al.flag_config_id
        WHERE fc.flag_id = $1
        ORDER BY al.created_at DESC
        LIMIT $2 OFFSET $3
    `;

    const result: QueryResult<IAuditLogDbRow> = await pool.query(query, [flagId, limit, offset]);

    return result.rows;
}
