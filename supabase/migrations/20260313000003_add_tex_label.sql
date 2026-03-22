ALTER TABLE thread_types ADD COLUMN tex_label VARCHAR(100);

UPDATE thread_types
SET tex_label = 'Tex ' || TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM tex_number::text))
WHERE tex_number IS NOT NULL AND tex_label IS NULL;
