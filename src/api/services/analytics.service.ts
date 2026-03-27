import { getEvalCounts } from '../../cache/analytics.cache.js';
import { validateFlagEnvAccess } from './authz.service.js';

export async function getAnalyticsForUser(userId: string, envId: string, flagId: string) {
    await validateFlagEnvAccess(userId, envId, flagId);
    const counts = await getEvalCounts(flagId, envId);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const distribution: Record<string, { count: number; percentage: number }> = {};

    for (const key in counts) {
        distribution[key] = {
            count: counts[key],
            percentage: total === 0 ? 0 : (counts[key] / total) * 100,
        };
    }

    return {
        total,
        distribution,
    };
}
