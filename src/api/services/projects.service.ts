import { compileDbRowToProject } from '../../loader/project.loader.js';
import { createProjectRow, getProjectRowById, listProjectRowsByUserId } from '../../db/project.db.js';
import { NotFoundError } from '../errors/NotFoundError.js';

export async function createProject(name: string, userId: string) {
    const row = await createProjectRow(name, userId);
    return compileDbRowToProject(row);
}

export async function listProjectsByUserId(userId: string, limit?: number, offset?: number) {
    const l = limit ?? 20;
    const o = offset ?? 0;

    const rows = await listProjectRowsByUserId(userId, l, o);
    return rows.map((row) => compileDbRowToProject(row));
}

export async function resolveProjectById(projectId: string) {
    const row = await getProjectRowById(projectId);
    if (!row) {
        throw new NotFoundError('Project not found');
    }
    return compileDbRowToProject(row);
}

export async function resolveProjectByIdForUser(userId: string, projectId: string) {
    // DRY >> µs diff in ms api calls (includes db calls => <1%)
    const project = await resolveProjectById(projectId);
    if (project.userId !== userId) {
        throw new NotFoundError('Project not found'); // Intentional (Other places we have 404 for unauthz, maintaining consistency here)
        // throw new UnauthorizedError('Access denied');
    }
    return project;
}
