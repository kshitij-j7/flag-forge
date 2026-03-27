import 'dotenv/config'; // Loads .env variables into process.env.VARIABLES // load ONCE at app entry // Always load before everything
import { webcrypto } from 'node:crypto';
globalThis.crypto = webcrypto as any;

import { createServer } from './server.js';
import { startSubscriber } from './cache/subscriber.js';
import { connectRedis } from './db/redis.js';
import { setupShutdown } from './shutdown.js';

async function start() {
    await connectRedis();
    await startSubscriber();

    const server = createServer();

    setupShutdown(server);
}

start();
