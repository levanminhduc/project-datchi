BEGIN;

DROP FUNCTION IF EXISTS fn_calculate_quota(integer, integer, integer, integer);
DROP FUNCTION IF EXISTS fn_check_quota(integer, integer, integer, integer);

ALTER TYPE thread_material RENAME VALUE 'polyester' TO 'POLYESTER';
ALTER TYPE thread_material RENAME VALUE 'cotton' TO 'COTTON';
ALTER TYPE thread_material RENAME VALUE 'nylon' TO 'NYLON';
ALTER TYPE thread_material RENAME VALUE 'silk' TO 'SILK';
ALTER TYPE thread_material RENAME VALUE 'rayon' TO 'RAYON';
ALTER TYPE thread_material RENAME VALUE 'mixed' TO 'MIXED';

ALTER TABLE thread_types ALTER COLUMN material SET DEFAULT 'POLYESTER'::thread_material;

NOTIFY pgrst, 'reload schema';

COMMIT;
