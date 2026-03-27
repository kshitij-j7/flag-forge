-- Control plane access. Stores admin/developer credentials (emails and hashed passwords) to log into the management dashboard.
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- NEVR STORE PLAIN PASSWORDS!!
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Top-level namespace. Groups flags and environments together (e.g., "E-Commerce App").
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,                        -- owner
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- The identity/name of a feature. (e.g., "dark-mode"). Defines what exists, not how it behaves. (that in flag_configs)
CREATE TABLE flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- no project, no feature:)
    key             TEXT NOT NULL,                        -- public identifier used in API (e.g. "dark-mode", "checkout-v2")
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(project_id, key), -- Ensures: same project cannot have duplicate keys, But different projects CAN reuse same key
    UNIQUE(id, project_id)   -- SO that flag_configs FK can work
);
-- CREATE INDEX idx_flags_project_key ON flags(project_id, key); -- DON'T NEED IT AS ALREADY CREATED BY UNIQUE(project_id, key) AND 2 INDEXES AFFECTS PERF

CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Deployment stages (e.g., "Production", "Staging"). Holds the unique sdk_key used by our client applications to authenticate and fetch flag data.
CREATE TABLE environments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- environment belongs to a project
    name            TEXT NOT NULL,                                          -- "production", "staging", etc.
    sdk_key         TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),-- Separate from user auth (JWT)
    -- sdk_key      TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,   -- WEAK: Predictible
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(id, project_id) -- SO that flag_configs FK can work
);
-- CREATE INDEX idx_env_sdk_key ON environments(sdk_key);

-- The core logic engine. Maps one flag to one environment. Stores the toggle state, rollout percentages, targeting rules, user overrides, and version.
CREATE TABLE flag_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id         UUID NOT NULL,                               -- links to flag identity.
    environment_id  UUID NOT NULL,                               -- links to environment.
    project_id      UUID NOT NULL REFERENCES projects(id),       -- to constraint with project
    enabled         BOOLEAN DEFAULT false,                       -- if false → evaluation immediately returns default_variant
    variants        JSONB NOT NULL DEFAULT '[]',                 -- [{ "key": "A", "weight": 50000 }, ... ]
    rules           JSONB NOT NULL DEFAULT '[]',                 -- conditional targeting rules (first match wins)
    targeting       JSONB NOT NULL DEFAULT '{}',                 -- explicit user overrides -- { "userId": "u1", "variant": "B" }
    default_variant TEXT NOT NULL DEFAULT 'control',             -- fallback when no targeting/rules/rollout match
    version         INT NOT NULL DEFAULT 1,                      -- increments on config changes (used for analytics/debugging/cache expiry)
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (jsonb_typeof(variants) = 'array'),
    CHECK (jsonb_typeof(rules) = 'array'),
    CHECK (jsonb_typeof(targeting) = 'object'),

    FOREIGN KEY (flag_id, project_id) REFERENCES flags(id, project_id) ON DELETE CASCADE, -- MAKING SURE: flag_config is attached to both
    FOREIGN KEY (environment_id, project_id) REFERENCES environments(id, project_id) ON DELETE CASCADE, -- flag and env of same project!!

    UNIQUE(environment_id, flag_id) -- creates index on: (environment_id, flag_id) so don't query: (flag_id, environment_id) ORDER MATTERS
);
-- NOTE: 
-- The DB Dilemma: If I normalize this, I'd need separate tables for rules, conditions, operators, and variants.
--      That means every time I want to evaluate a flag, I have to execute a massive, slow, 5-table JOIN query.
--      My goal is <1ms latency. SQL JOINs will kill my performance.
-- The Fix: I will use PostgreSQL's superpower: JSONB. I will store variants, rules, and targeting as flat JSON objects.
--      This allows me to grab the entire configuration in one massive, lightning-fast database read,
--      perfectly packaged to be shoved straight into my Redis cache.   

-- Immutable ledger. Records who changed a flag_config and the exact before and after JSON states.
-- Critical for debugging misconfigurations and enterprise compliance.
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_config_id  UUID NOT NULL REFERENCES flag_configs(id) ON DELETE CASCADE,
    actor           TEXT NOT NULL, -- userId or system
    action          TEXT NOT NULL, -- e.g. "UPDATE_CONFIG", "TOGGLE_FLAG"
    before          JSONB,
    after           JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_flag_config ON audit_logs(flag_config_id);

-- Extensibility layer. Stores destination URLs and secrets to securely notify external systems (e.g., Slack, CI/CD) when a flag is updated.
CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id  UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    secret          TEXT NOT NULL,
    events          TEXT[] NOT NULL, -- e.g. ['flag.updated']
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhooks_env_event ON webhooks(environment_id);

-- Version update function returned as trigger
CREATE OR REPLACE FUNCTION update_flag_config_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW IS DISTINCT FROM OLD THEN
        NEW.version = OLD.version + 1;
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_flag_configs_version -- execute trigger BEFORE UPDATE ON flag_configs => FOR EACH ROW => EXECUTE FUNCTION update_flag_config_version();
    BEFORE UPDATE ON flag_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_flag_config_version();