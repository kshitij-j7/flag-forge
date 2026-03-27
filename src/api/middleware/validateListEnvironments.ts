import { Request, Response, NextFunction } from "express";

export function validateListEnvironments(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;

    // projectId validation
    if (!projectId || typeof projectId !== "string") {
        return res.status(400).json({ error: "invalid projectId" });
    }

    next();
}
