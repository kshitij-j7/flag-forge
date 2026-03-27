-- 1. Project
INSERT INTO projects (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Project');

-- 2. Environments
INSERT INTO environments (id, project_id, name, sdk_key)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'production', encode(gen_random_bytes(32), 'hex')),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'staging', encode(gen_random_bytes(32), 'hex'));

-- 3. Flags
INSERT INTO flags (id, project_id, key)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'dark-mode'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'light-mode');

-- 4. Flag Configs
INSERT INTO flag_configs (
  id,
  flag_id,
  environment_id,
  enabled,
  variants,
  rules,
  targeting,
  default_variant
)
VALUES
(
  '00000000-0000-0000-0000-000000001000',
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000010',
  true,
  '[{"key":"control","weight":50000},{"key":"treatment","weight":50000}]',
  '[]',
  '{}',
  'control'
),
(
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000010',
  false,
  '[{"key":"A","weight":100000}]',
  '[]',
  '{}',
  'A'
);