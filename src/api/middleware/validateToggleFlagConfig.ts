import { Request, Response, NextFunction } from "express";

export function validateToggleFlagConfig(req: Request, res: Response, next: NextFunction) {
    const { flagId, envId } = req.params;
    const { enabled } = req.body;

    // params
    if (!flagId || typeof flagId !== "string") {
        return res.status(400).json({ error: "invalid flagId" });
    }
    if (!envId || typeof envId !== "string") {
        return res.status(400).json({ error: "invalid envId" });
    }
    // body
    if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be boolean" });
    }
    next();
}
