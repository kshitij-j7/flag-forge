import { BatchEvaluationInput, EvaluationInput, EvaluationResult } from '@flagforge/types';
import { evaluate } from '../../engine/evaluate.js';
import { getFlagConfigByKey, getFlagConfigBatch } from './flagConfig.read.service.js';
import { incrEval } from '../../cache/analytics.cache.js';

export async function evaluateService(input: EvaluationInput): Promise<EvaluationResult> {
    // Never place try catch inside service, only inside controller (exception exist) as getFlagConfigByKey err automtically propogates
    const flagConfig = await getFlagConfigByKey(input.envId, input.flagKey);

    const result = evaluate(input, flagConfig);
    // 3. Fire-and-Forget Analytics (Don't 'await' this, keep the response fast)
    // high QPS → unbounded promise creation → event loop pressure → will need batching at higher scale (later)
    incrEval(flagConfig.flagId, input.envId, result.variant ?? 'null').catch(console.error);
    return result;
}

export async function evaluateBatchService(input: BatchEvaluationInput): Promise<EvaluationResult[]> {
    const { envId, flagKeys, userId, attributes } = input;

    const uniqueKeys = [...new Set(flagKeys)];
    const flagConfigs = await getFlagConfigBatch(envId, uniqueKeys);

    // 2. Map configs to results
    return flagKeys.map((key) => {
        const flagConfig = flagConfigs.get(key);

        if (!flagConfig) {
            return {
                variant: null,
                reason: 'FLAG_NOT_FOUND',
                flagId: key,
                configVersion: 0,
            };
        }
        const result = evaluate(
            {
                userId,
                flagKey: key,
                attributes,
                envId,
            },
            flagConfig,
        );
        incrEval(flagConfig.flagId, envId, result.variant ?? 'null').catch(console.error);
        return result;
    });
}
