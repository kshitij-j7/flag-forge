type Op = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in';

export interface Project {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
}

export interface Variant {
    key: string;
    weight: number;
}
export type CompiledVariant = {
    key: string;
    cumulative: number;
};

export interface Rule {
    attribute: string;
    op: Op;
    value: unknown;
    variant: string;
}

export type Attributes = Record<string, string | number | boolean | (string | number)[]>;

interface EvaluationInputBase {
    readonly userId: string; // extracted from request, so engine never receives req directly
    readonly attributes?: Attributes; // collected once, not read inside engine from headers/query
    readonly envId: string; // identifies environment (dev/staging/prod) → ensures correct config is used
}

// EvaluationInput = everything the engine needs to decide a variant
export interface EvaluationInput extends EvaluationInputBase {
    readonly flagKey: string; // passed explicitly instead of relying on route (/flags/:key)
}

export interface BatchEvaluationInput extends EvaluationInputBase {
    readonly flagKeys: string[];
}

// enum-like type that standardizes *why* evaluation returned a result (prevents arbitrary strings)
export type EvaluationReason =
    | 'DISABLED' // flag exists but is turned off
    | 'TARGETING' // user matched explicit targeting override
    | 'RULE_MATCH' // user matched a rule condition
    | 'WEIGHTED' // user assigned via percentage rollout
    | 'NO_VARIANTS' // config invalid (no variants to choose from)
    | 'DEFAULT_FALLBACK'; // Reached when rollout fails or config is partial

// standardized output contract of engine → ensures every evaluation is predictable, debuggable, and consistent
export type EvaluationResult =
    | {
          reason: 'FLAG_NOT_FOUND'; // Only for Batch evaluation where specific flagKey and envId combination not found (we don't send 404 here to still output valid comb data)
          variant: null;
          flagId: string;
          configVersion: number;
          bucket?: undefined;
      }
    | {
          reason: EvaluationReason;
          variant: string;
          flagId: string;
          configVersion: number;
          bucket?: number;
      };

export interface Flag {
    id: string;
    projectId: string;
    key: string;
    createdAt: Date;
}

export type Environment = {
    id: string;
    projectId: string;
    name: string;
    createdAt: Date;
};

export type EnvWithSdkKey = {
    sdkKey: string;
} & Environment;

// complete configuration required by engine to evaluate a flag
export interface FlagConfig {
    flagId: string; // internal stable identifier → used for analytics, joins, and tracking across renames (stable across key changes)
    key: string; // identifies the flag (must match input.flagKey)
    enabled: boolean; // if false → evaluation stops immediately (DISABLED)
    compiledVariants: CompiledVariant[]; // list of possible outcomes with weights (used in rollout)
    defaultVariant: string;
    rules: Rule[]; // optional rule set for conditional targeting (evaluated before rollout)
    version: number; // increments on every config change → used for analytics consistency and debugging
    targeting: Targeting; // explicit overrides: userId → variant (highest priority)
}

export type Targeting = Record<string, string>;

export interface WebhookPayload {
    event: 'flag.updated' | 'flag.enabled' | 'flag.disabled';
    flagKey: string;
    environmentId: string;
    actor: string;
    timestamp: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
}

export interface Webhook {
    environmentId: string;
    url: string;
    secret: string;
    events: string[];
    createdAt: Date;
}
