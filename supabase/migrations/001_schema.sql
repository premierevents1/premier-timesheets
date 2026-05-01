-- Enable pgcrypto for bcrypt PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  location     text NOT NULL,
  export_code  text NOT NULL,
  default_start time NOT NULL,
  default_end   time NOT NULL,
  default_break integer NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  first_name   text NOT NULL,
  last_name    text NOT NULL,
  email        text UNIQUE NOT NULL,
  pin          text NOT NULL,
  role         text NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
  default_dept text NOT NULL REFERENCES departments(id),
  manager_id   uuid REFERENCES users(id),
  created_at   timestamptz DEFAULT now()
);

-- User ↔ Department access
CREATE TABLE IF NOT EXISTS user_departments (
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id text REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, department_id)
);

-- Timesheet entries
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          date NOT NULL,
  department_id text NOT NULL REFERENCES departments(id),
  start_time    time,
  end_time      time,
  break_mins    integer DEFAULT 0,
  total_hours   numeric(4,2) DEFAULT 0,
  leave_type    text CHECK (leave_type IN (
                  'Annual Leave', 'Annual Leave (½ day)',
                  'TOIL', 'TOIL (½ day)',
                  'Sick', 'Sick (½ day)'
                )),
  comment       text DEFAULT '',
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by   uuid REFERENCES users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timesheet_entries_updated_at
  BEFORE UPDATE ON timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PIN authentication RPC (returns user row if PIN matches)
CREATE OR REPLACE FUNCTION authenticate_pin(input_pin text)
RETURNS TABLE (
  id           uuid,
  name         text,
  first_name   text,
  last_name    text,
  email        text,
  role         text,
  default_dept text,
  manager_id   uuid
) SECURITY DEFINER AS $$
  SELECT u.id, u.name, u.first_name, u.last_name, u.email,
         u.role, u.default_dept, u.manager_id
  FROM   users u
  WHERE  u.pin = crypt(input_pin, u.pin)
  LIMIT  1;
$$ LANGUAGE sql;

-- PIN reset RPC
CREATE OR REPLACE FUNCTION reset_user_pin(target_user_id uuid, new_pin text)
RETURNS void SECURITY DEFINER AS $$
  UPDATE users SET pin = crypt(new_pin, gen_salt('bf', 10)) WHERE id = target_user_id;
$$ LANGUAGE sql;

-- Row Level Security
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS
-- (all API routes use service role key, so no user-level policies needed)
-- If you add client-side Supabase later, add policies here.
