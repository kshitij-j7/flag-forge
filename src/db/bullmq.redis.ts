import { ConnectionOptions } from 'bullmq';
import { REDIS_URL } from '../config/db.js';

const url = new URL(REDIS_URL);

export const bullmqConnection: ConnectionOptions = {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
};
