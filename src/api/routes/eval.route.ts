import { Router } from 'express';
import { validateEvalBatch } from '../middleware/validateEvalBatch.js';
import { validateEval } from '../middleware/validateEval.js';
import { evaluateBatchHandler, evaluateHandler } from '../controllers/eval.controller.js';

const evalRouter = Router();

evalRouter.post('/', validateEval, evaluateHandler);
evalRouter.post('/batch', validateEvalBatch, evaluateBatchHandler);

export default evalRouter;
