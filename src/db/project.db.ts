import { pool } from './index.js';
import { QueryResult } from 'pg';

export interface ProjectDbRow {
    id: string;
    name: string;
    created_at: Date;
    user_id: string;
}

export async function createProjectRow(name: string, userId: string): Promise<ProjectDbRow> {
    const query = `
        INSERT INTO projects (name, user_id)
        VALUES ($1, $2)
        RETURNING id, name, created_at, user_id
    `;

    const result: QueryResult<ProjectDbRow> = await pool.query(query, [name, userId]);

    return result.rows[0];
}

export async function listProjectRowsByUserId(userId: string, limit = 20, offset = 0): Promise<ProjectDbRow[]> {
    const query = `
        SELECT id, name, created_at, user_id
        FROM projects
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `;

    const result: QueryResult<ProjectDbRow> = await pool.query(query, [userId, limit, offset]);

    return result.rows;
}

export async function getProjectRowById(projectId: string): Promise<ProjectDbRow | null> {
    const query = `
        SELECT id, name, created_at, user_id
        FROM projects
        WHERE id = $1
        LIMIT 1
    `;

    const result: QueryResult<ProjectDbRow> = await pool.query(query, [projectId]);

    return result.rows[0] || null;
}

export async function existsProjectRowForUser(userId: string, projectId: string): Promise<boolean> {
    const query = `
        SELECT id
        FROM projects
        WHERE id = $2 AND user_id = $1
        LIMIT 1
    `;
    const result = await pool.query<{ id: string }>(query, [userId, projectId]);

    return !!result.rowCount;
}
