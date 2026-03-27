import { InvariantError } from '../api/errors/InvariantError.js';

const secret = process.env.JWT_SECRET;
if (!secret) throw new InvariantError('JWT_SECRET not set');

export const JWT_SECRET = new TextEncoder().encode(secret);
