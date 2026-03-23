ALTER TABLE thread_types
  ALTER COLUMN tex_number TYPE VARCHAR(20) USING tex_number::text;
