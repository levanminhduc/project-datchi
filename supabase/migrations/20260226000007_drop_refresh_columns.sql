ALTER TABLE employees DROP COLUMN IF EXISTS refresh_token;
ALTER TABLE employees DROP COLUMN IF EXISTS refresh_token_expires_at;
ALTER TABLE employees DROP COLUMN IF EXISTS password_hash;
