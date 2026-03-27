import { DB } from './types.js';

export type FlagDbRow = {
    id: string;
    project_id: string;
    key: string;
    created_at: Date;
};

export async function insertFlagRowForUser(db: DB, userId: string, projectId: string, key: string): Promise<FlagDbRow | null> {
    const query = `
        INSERT INTO flags (project_id, key)
        SELECT id, $2
        FROM projects
        WHERE id = $1 AND user_id = $3
        RETURNING id, project_id, key, created_at;
    `; // Inserting result of SELECT // Passing constant value (key by $2). we could also pass $1, $2 but p.id is more readable :P
    const res = await db.query<FlagDbRow>(query, [projectId, key, userId]);
    return res.rows[0] ?? null;
}

export async function getFlagRowsForUser(db: DB, userId: string, projectId: string): Promise<FlagDbRow[]> {
    const query = `
        SELECT f.id, f.project_id, f.key, f.created_at
        FROM flags f JOIN projects p ON f.project_id = p.id
        WHERE f.project_id = $1 AND p.user_id = $2
        ORDER BY f.created_at DESC
    `;
    const res = await db.query<FlagDbRow>(query, [projectId, userId]);
    return res.rows;
}

export async function getFlagRowById(db: DB, id: string): Promise<FlagDbRow | null> {
    const query = `
        SELECT id, project_id, key, created_at
        FROM flags
        WHERE id = $1
        LIMIT 1
    `;
    const res = await db.query<FlagDbRow>(query, [id]);
    return res.rows?.[0] ?? null;
}

export async function getFlagRowByIdForUser(db: DB, userId: string, id: string): Promise<FlagDbRow | null> {
    const query = `
        SELECT f.id, f.project_id, f.key, f.created_at
        FROM flags f JOIN projects p ON p.id = f.project_id AND p.user_id = $1
        WHERE f.id = $2
        LIMIT 1
    `;
    const res = await db.query<FlagDbRow>(query, [userId, id]);
    return res.rows?.[0] ?? null;
}

export async function getProjectIdFromFlagIdForUser(db: DB, userId: string, flagId: string): Promise<string | null> {
    const res = await db.query<{ project_id: string }>(
        `
            SELECT f.project_id
            FROM flags f
            JOIN projects p ON p.id = f.project_id AND p.user_id = $1
            WHERE f.id = $2
            LIMIT 1
        `,
        [userId, flagId],
    );

    return res.rows[0]?.project_id ?? null;
}
