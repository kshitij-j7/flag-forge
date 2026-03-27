import { pool } from '../../db/index.js';
import { insertFlagRowForUser, getFlagRowsForUser } from '../../db/flag.db.js';
import { Flag } from '@flagforge/types';
import { compileDbRowToFlag } from '../../loader/flag.loader.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { ConflictError } from '../errors/ConflictError.js';

export async function createFlagForUser(userId: string, projectId: string, key: string): Promise<Flag> {
    try {
        const row = await insertFlagRowForUser(pool, userId, projectId, key);
        if (!row) {
            throw new NotFoundError('Project not found');
        }
        return compileDbRowToFlag(row);
    } catch (err: any) {
        if (err.code === '23505') {
            throw new ConflictError('Flag already exists');
        }
        throw err;
    }
}

export async function getFlagsForUser(userId: string, projectId: string): Promise<Flag[]> {
    const rows = await getFlagRowsForUser(pool, userId, projectId);
    return rows.map((row) => compileDbRowToFlag(row));
}
