import { Request, Response, NextFunction } from 'express';
import { createProject, listProjectsByUserId, resolveProjectById, resolveProjectByIdForUser } from '../services/projects.service.js';

export async function createProjectHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { name } = req.body;
        const userId = req.userId!;

        const project = await createProject(name.trim(), userId);

        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
}

export async function listProjectsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const offset = req.query.offset ? Number(req.query.offset) : undefined;
        const userId = req.userId!;

        const projects = await listProjectsByUserId(userId, limit, offset);

        res.status(200).json(projects);
    } catch (err) {
        next(err);
    }
}

export async function getProjectHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params as { projectId: string };
        const userId = req.userId!

        const project = await resolveProjectByIdForUser(userId, projectId);

        res.status(200).json(project);
    } catch (err) {
        next(err);
    }
}
