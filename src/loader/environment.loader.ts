import { Environment, EnvWithSdkKey } from '@flagforge/types';
import { EnvironmentDbRow } from '../db/environment.db.js';

export function compileDbRowToEnvironment(row: EnvironmentDbRow): Environment {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        createdAt: row.created_at,
    };
}

export function compileDbRowToEnvWithSdkKey(row: EnvironmentDbRow): EnvWithSdkKey {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        createdAt: row.created_at,
        sdkKey: row.sdk_key,
    };
}
