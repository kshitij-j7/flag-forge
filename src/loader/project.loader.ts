import { Project } from '@flagforge/types';
import { ProjectDbRow } from '../db/project.db.js';

export function compileDbRowToProject(row: ProjectDbRow): Project {
    return {
        id: row.id,
        name: row.name,
        userId: row.user_id,
        createdAt: row.created_at,
    };
}
