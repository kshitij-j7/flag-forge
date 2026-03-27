import { CompiledVariant } from '@flagforge/types';
import { InvariantError } from '../api/errors/InvariantError.js';

// To choose which variant a bucket is given like (eg: 81000):
// (10%) A → 10000 → skip
// (20%) B → 20000 → skip
// (30%) C → 30000 → hit
// (40%) D → 40000 → miss
export function chooseVariant(bucket: number, variants: CompiledVariant[]): string {
    if (variants.length === 0) {
        throw new InvariantError('variants array cannot be empty');
    }
    // if (variants[variants.length - 1].cumulative != 100000) { // DON'T KEEP IN HOT PATH, Keep in validation
    //     throw new InvariantError(`variants weights don't add to 100000`);
    // }
    let left = 0;
    let right = variants.length - 1;
    let resultIndex = -1;

    while (left <= right) {
        const mid = (left + right) >> 1;

        if (bucket < variants[mid].cumulative) {
            resultIndex = mid;
            right = mid - 1; // search left for first match
        } else {
            left = mid + 1;
        }
    }
    if (resultIndex === -1) {
        throw new InvariantError('no variant matched bucket — invalid cumulative weights');
    }
    return variants[resultIndex].key;
}
