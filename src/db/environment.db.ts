import { DB } from './types.js';

export interface EnvironmentDbRow {
    id: string;
    project_id: string;
    name: string;
    sdk_key: string;
    created_at: Date;
}

export async function insertEnvRow(db: DB, projectId: string, name: string): Promise<EnvironmentDbRow> {
    const query = `
        INSERT INTO environments (project_id, name)
        VALUES ($1, $2)
        RETURNING id, project_id, name, sdk_key, created_at
    `;

    const res = await db.query<EnvironmentDbRow>(query, [projectId, name]);
    return res.rows[0];
}

export async function getEnvRowByIdForUser(db: DB, userId: string, envId: string): Promise<EnvironmentDbRow | null> {
    const query = `
        SELECT e.id, e.project_id, e.name, e.sdk_key, e.created_at
        FROM environments e JOIN projects p ON e.project_id = p.id
        WHERE e.id = $1 AND p.user_id = $2
    `;

    const res = await db.query<EnvironmentDbRow>(query, [envId, userId]);
    return res.rows[0] ?? null;
}

export async function getEnvRowsByProjectIdForUser(db: DB, userId: string, projectId: string): Promise<EnvironmentDbRow[]> {
    const query = `
        SELECT e.id, e.project_id, e.name, e.sdk_key, e.created_at
        FROM environments e JOIN projects p ON e.project_id = p.id
        WHERE e.project_id = $1 AND p.user_id = $2
        ORDER BY e.created_at DESC
    `;

    const res = await db.query<EnvironmentDbRow>(query, [projectId, userId]);
    return res.rows;
}

export async function getEnvRowBySdkKey(db: DB, sdkKey: string): Promise<EnvironmentDbRow | null> {
    const query = `
        SELECT id, project_id, name, sdk_key, created_at
        FROM environments
        WHERE sdk_key = $1
        LIMIT 1
    `;

    const res = await db.query<EnvironmentDbRow>(query, [sdkKey]);
    return res.rows[0] ?? null;
}

// Very security critical!! hence db level authz
export async function updateEnvRowSdkKey(db: DB, userId: string, envId: string, newKey: string): Promise<EnvironmentDbRow | null> {
    const query = `
        UPDATE environments e
        SET sdk_key = $1
        FROM projects p
        WHERE e.id = $2 AND e.project_id = p.id AND p.user_id = $3
        RETURNING e.id, e.project_id, e.name, e.sdk_key, e.created_at
    `;

    const res = await db.query<EnvironmentDbRow>(query, [newKey, envId, userId]);

    return res.rows[0] ?? null;
}
