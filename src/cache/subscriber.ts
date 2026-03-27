import { createClient } from 'redis';
import { invalidateFlagConfigCache } from './flagConfig.cache.js';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL not set');

const subscriber = createClient({ url: REDIS_URL });

export async function startSubscriber() {
    await subscriber.connect();

    // pattern subscribe → all envs
    await subscriber.pSubscribe('flag:updates:*', async (message, channel) => {
        try {
            const { flagKey } = JSON.parse(message);

            // channel = flag:updates:{envId}
            const envId = channel.split(':')[2];

            await invalidateFlagConfigCache(envId, flagKey);
        } catch {
            // swallow → never crash subscriber
        }
    });
}

