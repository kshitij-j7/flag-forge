# FlagForge

A feature flag and experimentation platform I built from scratch. Think LaunchDarkly but you own the whole thing. Backend only for now, frontend and SDK are next.

---

## What it does

You create projects, add environments (like production/staging), define flags, configure how they roll out, and your app calls the eval API to get back a variant. The evaluation is deterministic: same user, same flag, always same result. No randomness involved.

The eval path goes: Redis cache → if miss, hit Postgres → run evaluation engine → return variant. The engine does targeting overrides first, then rule matching, then weighted rollout via MurmurHash bucketing. The whole thing is designed to be fast, stateless, and correct.

---

## Stack

- Node.js + Express 5
- PostgreSQL: source of truth for everything
- Redis: config cache + pub/sub for cache invalidation
- BullMQ: async webhook delivery with retries
- TypeScript (strict mode, no `any` anywhere)
- Argon2 for passwords, JOSE for JWTs, Zod for request validation

---

## Setup

You need Docker, Node 18+, and psql.

```bash
docker compose up --build
```

Create a `.env`:

```
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/flagforge
REDIS_URL=redis://localhost:6379
JWT_SECRET=whatever
```

Server starts at `http://localhost:3000`.

---

## API

### Auth

```
POST /api/auth/register
POST /api/auth/login
```

Register takes `email` + `password`. Login returns a JWT. Every other endpoint requires `Authorization: Bearer <token>`.

Login is rate limited per email and per IP using a Redis pipeline.

---

### Projects

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
```

A project is the top-level container. Everything (flags, environments) lives inside a project.

---

### Environments

```
GET   /api/projects/:projectId/environments
POST  /api/projects/:projectId/environments
POST  /api/environments/:envId/sdk-key/rotate
```

Environments are things like production, staging, dev. Each one gets a unique `sdk_key` (32 random bytes hex-encoded) which is what you pass to the eval API. You can rotate it if it gets leaked.

---

### Flags

```
GET   /api/projects/:projectId/flags
POST  /api/projects/:projectId/flags
```

A flag is just a name/key. The actual behaviour (variants, rules, rollout) is configured per-environment in the flag config.

---

### Flag Config

```
PUT   /api/flags/:flagId/config/:envId
GET   /api/flags/:flagId/config/:envId
PATCH /api/flags/:flagId/config/:envId/toggle
```

This is where the real stuff lives. The config holds:

- `enabled`: if false, everyone gets the default variant immediately, no eval runs
- `variants`: array of `{ key, weight }` where weights must sum to exactly 100,000
- `rules`: ordered list of targeting rules, first match wins. Supports `eq`, `neq`, `contains`, `gt`, `lt`, `in` operators on any user attribute
- `targeting`: explicit user overrides, `{ userId: variantKey }`. These take highest priority, before rules and rollout
- `defaultVariant`: fallback if nothing matches

One thing worth knowing: you can't change variant weights on an active (enabled) flag. The API rejects it. This is intentional. Changing weights mid-experiment corrupts your results.

Every write publishes to Redis pub/sub which invalidates the cache on all running instances. So updates propagate without a restart.

---

### Evaluation (the hot path)

```
POST /api/eval
POST /api/eval/batch
```

This is the data plane. Authenticated with the `sdk_key` (not JWT). Rate limited per environment: 100 req/min by default.

Single eval body:

```json
{
    "userId": "user_123",
    "flagKey": "checkout-redesign",
    "attributes": {
        "country": "IN",
        "plan": "pro"
    }
}
```

Response:

```json
{
    "variant": "treatment",
    "reason": "WEIGHTED",
    "bucket": 34721,
    "configVersion": 3
}
```

`reason` tells you why you got that variant: `DISABLED`, `TARGETING`, `RULE_MATCH`, or `WEIGHTED`. `bucket` is exposed for debugging. `configVersion` lets you correlate results to a specific config state.

Batch eval takes `flagKeys: string[]` and returns one result per key. Cache lookups run in parallel, then a single DB query fetches only the keys that missed.

---

### Analytics

```
GET /api/flags/:flagId/analytics/:envId
```

Returns eval counts per variant with percentages. Counts are tracked in Redis (fire-and-forget on every eval, doesn't touch the DB). Response looks like:

```json
{
    "total": 4821,
    "distribution": {
        "control": { "count": 2410, "percentage": 49.99 },
        "treatment": { "count": 2411, "percentage": 50.01 }
    }
}
```

---

### Audit Log

```
GET /api/flags/:flagId/audit
```

Every flag config write (upsert or toggle) creates an immutable audit log entry with the full `before` and `after` state as JSON diffs, plus the actor (userId) and timestamp. Useful for debugging when someone broke prod at 2am.

---

### Webhooks

```
GET    /api/environments/:envId/webhooks
POST   /api/environments/:envId/webhooks
DELETE /api/webhooks/:webhookId
```

Register a URL to get notified on `flag.updated` events. Each delivery is signed with HMAC-SHA256 using your webhook secret, verify the `x-flagforge-signature` header on your end. Delivery is async via BullMQ, retries automatically on non-2xx responses, 5s timeout per attempt.

---

## How evaluation works

For a given `(userId, flagKey)`:

1. If flag is disabled → return `defaultVariant` with reason `DISABLED`
2. If userId is in the `targeting` map → return that variant with reason `TARGETING`
3. Loop through `rules` in order. First match returns that variant with reason `RULE_MATCH`
4. Hash `"userId:flagKey"` with MurmurHash v3, take mod 100,000 to get a bucket (0–99,999). Binary search through cumulative variant weights to find which variant owns that bucket. Return with reason `WEIGHTED`

The hash is deterministic so the same user always lands in the same bucket for the same flag. Moving a user between variants requires an explicit targeting override or changing the rules.
