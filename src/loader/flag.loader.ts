import { Flag } from '@flagforge/types';
import { FlagDbRow } from '../db/flag.db.js';

export function compileDbRowToFlag(row: FlagDbRow): Flag {
    return {
        id: row.id,
        projectId: row.project_id,
        key: row.key,
        createdAt: row.created_at,
    };
}
