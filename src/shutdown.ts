import { Server } from 'http';
import { pool } from './db/index.js';
import { redis } from './db/redis.js';
import { webhookQueue } from './workers/webhook.queue.js';
import { webhookWorker } from './workers/webhook.worker.js';

let shuttingDown = false;

export function setupShutdown(server: Server) {
    async function shutdown(signal: string) {
        if (shuttingDown) return;
        shuttingDown = true;

        console.log(`Received ${signal}. Shutting down...`);

        server.close(async () => {
            try {
                await pool.end();
                await redis.quit();
                await webhookWorker.close();
                await webhookQueue.close();

                console.log('Shutdown complete');
                process.exit(0);
            } catch (err) {
                console.error(err);
                process.exit(1);
            }
        });

        setTimeout(() => process.exit(1), 10000);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
