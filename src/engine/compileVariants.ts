import { Variant, CompiledVariant } from '@flagforge/types';
import { InvariantError } from '../api/errors/InvariantError.js';

export function compileVariants(variants: Variant[]): CompiledVariant[] {
    // TODO: cache Compiledvariant[] lookup
    let sum = 0;

    const compiled = variants.map((v) => {
        sum += v.weight;
        return { key: v.key, cumulative: sum };
    });

    if (sum !== 100000) {
        throw new InvariantError('invalid weights');
    }

    return compiled;
}
