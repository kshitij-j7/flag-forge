import { Request, Response, NextFunction } from "express";

export function validateCreateFlag(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params;
    const { key } = req.body;

    // ---- projectId validation ----
    if (!projectId || typeof projectId !== "string") {
        return res.status(400).json({ error: "Invalid projectId" });
    }

    // ---- key validation ----
    if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "key is required and must be string" });
    }

    next();
}
