import { Router } from 'express';
import { createProjectHandler, listProjectsHandler, getProjectHandler } from '../controllers/projects.controller.js';
import { validateCreateProject } from '../middleware/validateCreateProject.js';
import { validateListProjects } from '../middleware/validateListProjects.js';
import { validateGetProject } from '../middleware/validateGetProject.js';
import { validateListEnvironments } from '../middleware/validateListEnvironments.js';
import { validateCreateFlag } from '../middleware/validateCreateFlag.js';
import { validateCreateEnvironment } from '../middleware/validateCreateEnvironment.js';
import { validateListFlag } from '../middleware/validateListFlags.js';
import { listEnvsHandler, createEnvHandler } from '../controllers/environments.controller.js';
import { listFlagsHandler, createFlagHandler } from '../controllers/flags.controller.js';

const projectsRouter = Router();

projectsRouter.get('/', validateListProjects, listProjectsHandler);
projectsRouter.post('/', validateCreateProject, createProjectHandler);
projectsRouter.get('/:projectId', validateGetProject, getProjectHandler);

projectsRouter.get('/:projectId/environments', validateListEnvironments, listEnvsHandler);
projectsRouter.post('/:projectId/environments', validateCreateEnvironment, createEnvHandler);

projectsRouter.get('/:projectId/flags', validateListFlag, listFlagsHandler);
projectsRouter.post('/:projectId/flags', validateCreateFlag, createFlagHandler);

export default projectsRouter;
