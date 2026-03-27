import express from 'express';
import evalRouter from './api/routes/eval.route.js';
import { globalErrorHandler } from './api/middleware/globalErrorHandler.js';
import flagRouter from './api/routes/flags.route.js';
import authRouter from './api/routes/auth.route.js';
import projectsRouter from './api/routes/projects.route.js';
import webhooksRouter from './api/routes/webhooks.route.js';
import environmentRouter from './api/routes/environments.route.js';
import { authMiddleware } from './api/middleware/auth.middleware.js';
import { sdkAuthMiddleware } from './api/middleware/sdkAuth.middleware.js';
import { evalRateLimit } from './api/middleware/evalRateLimit.js';
import { requestLogger } from './api/middleware/requestLogger.js';

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(requestLogger);

    app.use('/api/auth', authRouter);
    app.use('/api/eval', sdkAuthMiddleware, evalRateLimit, evalRouter); // Hot path, optimize aggressively

    app.use('/api', authMiddleware); // everything below is protected

    app.use('/api/projects', projectsRouter); // warm path
    app.use('/api/flags', flagRouter); // warm + cold paths
    app.use('/api/environments', environmentRouter); // cold path (check inside)
    app.use('/api/webhooks', webhooksRouter); // cold path
    // 404 handler (must come AFTER routes, BEFORE error handler)
    app.use((req, res) => {
        res.status(404).json({ error: 'route not found' });
    });
    // global error handler (must be LAST)
    app.use(globalErrorHandler);

    return app;
}
