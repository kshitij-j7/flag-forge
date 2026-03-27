import murmurhash from 'murmurhash';

// Deterministically maps (userId, flagKey) → bucket [0, 99999]
// Same input → same bucket (critical for experiment stability)
export function getBucket(userId: string, flagKey: string): number {
    const input = `${userId}:${flagKey}`;
    const hash = murmurhash.v3(input);
    // FIX: >>> 0 forces an unsigned 32-bit integer. This is faster and safer than Math.abs()
    return (hash >>> 0) % 100000;
}
