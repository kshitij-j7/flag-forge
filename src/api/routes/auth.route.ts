import { Router } from 'express';
import { registerHandler, loginHandler } from '../controllers/auth.controller.js';
import { validateRegister } from '../middleware/validateRegister.js';
import { validateLogin } from '../middleware/validateLogin.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const authRouter = Router();

authRouter.post('/register', validateRegister, registerHandler);
authRouter.post('/login', loginRateLimit, validateLogin, loginHandler);

export default authRouter;
