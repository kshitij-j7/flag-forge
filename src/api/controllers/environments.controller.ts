import { NextFunction, Request, Response } from 'express';
import { createEnv, getEnvsByProjectForUser, rotateEnvSdkKeyForUser } from '../services/environments.service.js';

export async function createEnvHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const projectId = req.params.projectId as string;
        const { name } = req.body as { name: string };

        const env = await createEnv(projectId, name);
        res.status(201).json(env);
    } catch (err) {
        next(err);
    }
}

export async function listEnvsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const projectId = req.params.projectId as string;
        const userId = req.userId!;

        const envs = await getEnvsByProjectForUser(userId, projectId);
        res.json(envs);
    } catch (err) {
        next(err);
    }
}

export async function rotateEnvSdkKeyHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { envId } = req.params as { envId: string };
        const userId = req.userId!;
        const newKey = await rotateEnvSdkKeyForUser(userId, envId);

        return res.json({ sdkKey: newKey });
    } catch (err) {
        next(err);
    }
}
