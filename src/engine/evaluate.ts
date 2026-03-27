import { EvaluationInput, EvaluationResult, FlagConfig } from '@flagforge/types';
import { matchesRule } from './rules.js'; // assumes rules.ts exposes rule matcher
import { getBucket } from './hash.js';
import { chooseVariant } from './chooseVariant.js';
import { InvariantError } from '../api/errors/InvariantError.js';

// pure function → takes input data, returns result, no side effects
export function evaluate(input: EvaluationInput, config: FlagConfig): EvaluationResult {
    // if (!config) { // useless if type guarantees + service contract // signals upstream bug → fine, but redundant
    //     throw new InvariantError(`Invariant Violation: Config missing for ${input.flagKey}`);
    // }
    // INTERNAL SAFEGUARDS: If these hit, it's a bug in be code, not a user error.
    if (config.key !== input.flagKey) {
        // high-signal invariant (detects wrong config wiring) // O(1), worth keeping
        throw new InvariantError(`Invariant Violation: Config mismatch. Expected ${input.flagKey}, got ${config.key}`);
    }
    // if flag is disabled → stop evaluation early
    if (!config.enabled) {
        return {
            variant: config.defaultVariant, // default variant served so ui doesn't break when disabled
            reason: 'DISABLED', // explicit stop reason
            flagId: config.flagId,
            configVersion: config.version, // attach version for traceability
        };
    }

    // targeting override → explicit user assignment (highest priority): [targeting > rules > rollout]
    const targetedVariant = config.targeting?.[input.userId];
    if (targetedVariant) {
        return {
            variant: targetedVariant, // directly return assigned variant
            reason: 'TARGETING', // bypass all other logic
            flagId: config.flagId,
            configVersion: config.version,
        };
    }

    // rules evaluation → first matching rule wins (ordered priority)
    // Not dependent on input.attributes because we may have attribute less rules like 'always'
    for (const rule of config.rules) {
        // config.rules always present in types empty or not
        if (matchesRule(rule, input.attributes)) {
            return {
                variant: rule.variant, // variant defined by rule
                reason: 'RULE_MATCH', // rule-based decision
                flagId: config.flagId,
                configVersion: config.version,
            };
        }
    }

    // weighted rollout → deterministic assignment using bucket + weights
    const bucket = getBucket(input.userId, input.flagKey); // stable bucket (0–99999)
    const variantKey = chooseVariant(bucket, config.compiledVariants);
    return {
        variant: variantKey, // already a string (not object)
        reason: 'WEIGHTED',
        flagId: config.flagId,
        bucket, // expose for debugging/analytics
        configVersion: config.version,
    };
}
