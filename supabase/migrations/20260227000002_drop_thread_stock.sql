BEGIN;

DROP FUNCTION IF EXISTS fn_migrate_inventory_to_stock();
DROP FUNCTION IF EXISTS fn_stock_to_inventory();
DROP TABLE IF EXISTS thread_stock CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
