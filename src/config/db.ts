import { InvariantError } from '../api/errors/InvariantError.js';

const _REDIS_URL = process.env.REDIS_URL;
if (!_REDIS_URL) {
    throw new InvariantError('REDIS_URL is not defined');
}
export const REDIS_URL = _REDIS_URL;

const _DATABASE_URL = process.env.DATABASE_URL;
if (!_DATABASE_URL) {
    throw new InvariantError('DATABASE_URL is not defined');
}
export const DATABASE_URL = _DATABASE_URL;
