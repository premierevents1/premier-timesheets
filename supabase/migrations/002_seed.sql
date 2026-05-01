-- Seed departments
INSERT INTO departments (id, name, location, export_code, default_start, default_end, default_break) VALUES
  ('technician', 'Technician', 'Premier UK Events Ltd', 'PRE', '09:00', '17:00', 30),
  ('warehouse',  'Warehouse',  'Premier UK Events Ltd', 'PRE', '09:00', '17:30', 60),
  ('woodshop',   'Woodshop',   'Unit 43 - Woodshop',    'UNI', '08:00', '16:00', 60),
  ('accounts',   'Accounts',   'Premier UK Events Ltd', 'PRE', '09:00', '17:00', 60)
ON CONFLICT (id) DO NOTHING;

-- Seed users (PINs hashed with bcrypt cost 10)
-- Temporary: insert with plain-text then hash, using pgcrypto
-- PIN format: 1001–1014 matching the prototype
INSERT INTO users (id, name, first_name, last_name, email, pin, role, default_dept) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Aivars Mazjanis',         'Aivars',    'Mazjanis',         'aivars.mazjanis@premier-ltd.com',         crypt('1001', gen_salt('bf', 10)), 'staff',   'warehouse'),
  ('00000000-0000-0000-0000-000000000002', 'Alex Horder',             'Alex',      'Horder',           'alex.horder@premier-ltd.com',             crypt('1002', gen_salt('bf', 10)), 'manager', 'warehouse'),
  ('00000000-0000-0000-0000-000000000003', 'Ben Colverson',           'Ben',       'Colverson',        'ben.colverson@premier-ltd.com',           crypt('1003', gen_salt('bf', 10)), 'staff',   'warehouse'),
  ('00000000-0000-0000-0000-000000000004', 'Callum Pell',             'Callum',    'Pell',             'callum.pell@premier-ltd.com',             crypt('1004', gen_salt('bf', 10)), 'staff',   'warehouse'),
  ('00000000-0000-0000-0000-000000000005', 'Calum Fitzpatrick',       'Calum',     'Fitzpatrick',      'calum.fitzpatrick@premier-ltd.com',       crypt('1005', gen_salt('bf', 10)), 'manager', 'woodshop'),
  ('00000000-0000-0000-0000-000000000006', 'Charlie Stevenson-Deacon','Charlie',   'Stevenson-Deacon', 'charlie.stevensondeacon@premier-ltd.com', crypt('1006', gen_salt('bf', 10)), 'staff',   'warehouse'),
  ('00000000-0000-0000-0000-000000000007', 'Charlotte Gambrill',      'Charlotte', 'Gambrill',         'charlotte.gambrill@premier-ltd.com',      crypt('1007', gen_salt('bf', 10)), 'admin',   'accounts'),
  ('00000000-0000-0000-0000-000000000008', 'Chris Finch',             'Chris',     'Finch',            'chris.finch@premier-ltd.com',             crypt('1008', gen_salt('bf', 10)), 'manager', 'technician'),
  ('00000000-0000-0000-0000-000000000009', 'Dade Freeman',            'Dade',      'Freeman',          'dade.freeman@premier-ltd.com',            crypt('1009', gen_salt('bf', 10)), 'staff',   'woodshop'),
  ('00000000-0000-0000-0000-000000000010', 'Danny Wells',             'Danny',     'Wells',            'danny.wells@premier-ltd.com',             crypt('1010', gen_salt('bf', 10)), 'staff',   'technician'),
  ('00000000-0000-0000-0000-000000000011', 'Kamil Miler',             'Kamil',     'Miler',            'kamil.miler@premier-ltd.com',             crypt('1011', gen_salt('bf', 10)), 'staff',   'warehouse'),
  ('00000000-0000-0000-0000-000000000012', 'Kieran Shutler',          'Kieran',    'Shutler',          'kieran.shutler@premier-ltd.com',          crypt('1012', gen_salt('bf', 10)), 'staff',   'technician'),
  ('00000000-0000-0000-0000-000000000013', 'Rachel Howden',           'Rachel',    'Howden',           'rachel.howden@premier-ltd.com',           crypt('1013', gen_salt('bf', 10)), 'staff',   'accounts'),
  ('00000000-0000-0000-0000-000000000014', 'Tom Williams',            'Tom',       'Williams',         'tom.williams@premier-ltd.com',            crypt('1014', gen_salt('bf', 10)), 'staff',   'woodshop')
ON CONFLICT (id) DO NOTHING;

-- Set manager relationships
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000002'
  WHERE id IN (
    '00000000-0000-0000-0000-000000000001', -- Aivars → Alex
    '00000000-0000-0000-0000-000000000003', -- Ben → Alex
    '00000000-0000-0000-0000-000000000004', -- Callum → Alex
    '00000000-0000-0000-0000-000000000006'  -- Charlie → Alex
  );
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000005'
  WHERE id IN (
    '00000000-0000-0000-0000-000000000009', -- Dade → Calum
    '00000000-0000-0000-0000-000000000014'  -- Tom → Calum
  );
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000007'
  WHERE id = '00000000-0000-0000-0000-000000000013'; -- Rachel → Charlotte
UPDATE users SET manager_id = '00000000-0000-0000-0000-000000000008'
  WHERE id IN (
    '00000000-0000-0000-0000-000000000010', -- Danny → Chris
    '00000000-0000-0000-0000-000000000012'  -- Kieran → Chris
  );

-- Seed user_departments access
INSERT INTO user_departments (user_id, department_id) VALUES
  -- Aivars: warehouse + technician
  ('00000000-0000-0000-0000-000000000001', 'warehouse'),
  ('00000000-0000-0000-0000-000000000001', 'technician'),
  -- Alex (manager): warehouse + technician
  ('00000000-0000-0000-0000-000000000002', 'warehouse'),
  ('00000000-0000-0000-0000-000000000002', 'technician'),
  -- Ben: warehouse + technician
  ('00000000-0000-0000-0000-000000000003', 'warehouse'),
  ('00000000-0000-0000-0000-000000000003', 'technician'),
  -- Callum: warehouse only
  ('00000000-0000-0000-0000-000000000004', 'warehouse'),
  -- Calum (manager): woodshop
  ('00000000-0000-0000-0000-000000000005', 'woodshop'),
  -- Charlie S-D: warehouse only
  ('00000000-0000-0000-0000-000000000006', 'warehouse'),
  -- Charlotte (admin): all
  ('00000000-0000-0000-0000-000000000007', 'accounts'),
  ('00000000-0000-0000-0000-000000000007', 'warehouse'),
  ('00000000-0000-0000-0000-000000000007', 'technician'),
  ('00000000-0000-0000-0000-000000000007', 'woodshop'),
  -- Chris (manager): technician + warehouse
  ('00000000-0000-0000-0000-000000000008', 'technician'),
  ('00000000-0000-0000-0000-000000000008', 'warehouse'),
  -- Dade: woodshop only
  ('00000000-0000-0000-0000-000000000009', 'woodshop'),
  -- Danny: technician + warehouse
  ('00000000-0000-0000-0000-000000000010', 'technician'),
  ('00000000-0000-0000-0000-000000000010', 'warehouse'),
  -- Kamil: warehouse only
  ('00000000-0000-0000-0000-000000000011', 'warehouse'),
  -- Kieran: technician + warehouse
  ('00000000-0000-0000-0000-000000000012', 'technician'),
  ('00000000-0000-0000-0000-000000000012', 'warehouse'),
  -- Rachel: accounts only
  ('00000000-0000-0000-0000-000000000013', 'accounts'),
  -- Tom: woodshop only
  ('00000000-0000-0000-0000-000000000014', 'woodshop')
ON CONFLICT DO NOTHING;
