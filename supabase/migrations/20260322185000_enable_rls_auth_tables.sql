-- Enable RLS on auth-related tables
-- service_role (used by Hono backend) bypasses RLS automatically
-- anon/authenticated users CANNOT query these tables via PostgREST

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions FORCE ROW LEVEL SECURITY;
