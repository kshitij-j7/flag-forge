import { getProjectIdFromFlagEnvForUser } from '../../db/flagConfig.db.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { pool } from '../../db/index.js';
import { getProjectIdFromFlagIdForUser } from '../../db/flag.db.js';
import { existsProjectRowForUser } from '../../db/project.db.js';

export async function validateProjectAccess(userId: string, projectId: string): Promise<void> {
    const exists = await existsProjectRowForUser(userId, projectId);
    if (!exists) {
        throw new NotFoundError('Project not found');
    }
}

export async function validateFlagEnvAccess(userId: string, envId: string, flagId: string): Promise<void> {
    const projectId = await getProjectIdFromFlagEnvForUser(pool, userId, envId, flagId);
    if (!projectId) {
        throw new NotFoundError('Invalid FlagId or EnvId');
    }
}

export async function validateFlagAccess(userId: string, flagId: string): Promise<void> {
    const projectId = await getProjectIdFromFlagIdForUser(pool, userId, flagId);
    if (!projectId) {
        throw new NotFoundError('FlagId not found');
    }
}
