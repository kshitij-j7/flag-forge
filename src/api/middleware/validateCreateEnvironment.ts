import { Request, Response, NextFunction } from "express";

export function validateCreateEnvironment(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { name } = req.body;

    // projectId validation
    if (!projectId || typeof projectId !== "string") {
        return res.status(400).json({ error: "invalid projectId" });
    }

    // name validation
    if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "invalid name" });
    }

    next();
}
