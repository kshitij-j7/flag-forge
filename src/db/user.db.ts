import { pool } from './index.js';

export interface UserDbRow {
    id: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

export async function createUser(email: string, passwordHash: string): Promise<UserDbRow | null> {
    const query = `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, password_hash, created_at
    `;
    const result = await pool.query<UserDbRow>(query, [email, passwordHash]);
    // WE HAVE DO NOTHING ON CONFLICt
    if (result.rowCount === 0) return null;
    // Note: ON CONFLICT only works on columns that have a UNIQUE or PRIMARY KEY constraint

    return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<UserDbRow | null> {
    const query = `
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = $1
    `;
    const result = await pool.query<UserDbRow>(query, [email]);

    return result.rows[0] || null;
}
