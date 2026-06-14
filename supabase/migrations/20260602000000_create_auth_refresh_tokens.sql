-- W2 Auth: self-hosted refresh-token storage (replaces Supabase GoTrue refresh tokens).
-- Stores only the SHA-256 hash of each refresh token; the raw token never touches the DB.
-- Rotation lineage (rotated_from) + revoked_at enable rotate-on-refresh with reuse detection.
-- No data deletion anywhere; this only ADDS a table.

CREATE TABLE IF NOT EXISTS public.auth_refresh_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,
  employee_id   integer NOT NULL REFERENCES public.employees(id),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  rotated_from  uuid REFERENCES public.auth_refresh_tokens(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_employee_id
  ON public.auth_refresh_tokens (employee_id);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expires_at
  ON public.auth_refresh_tokens (expires_at);
