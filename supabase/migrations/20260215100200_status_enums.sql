BEGIN;

CREATE TYPE po_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED');

UPDATE purchase_orders SET status = UPPER(status) WHERE status IS NOT NULL AND status != '';

ALTER TABLE purchase_orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE po_status USING status::po_status,
  ALTER COLUMN status SET DEFAULT 'PENDING';

CREATE TYPE order_week_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

UPDATE thread_order_weeks SET status = UPPER(status) WHERE status IS NOT NULL AND status != '';

ALTER TABLE thread_order_weeks
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_week_status USING status::order_week_status,
  ALTER COLUMN status SET DEFAULT 'DRAFT';

CREATE TYPE order_delivery_status AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

UPDATE thread_order_deliveries SET status = UPPER(status) WHERE status IS NOT NULL AND status != '';

ALTER TABLE thread_order_deliveries
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_delivery_status USING status::order_delivery_status,
  ALTER COLUMN status SET DEFAULT 'PENDING';

CREATE TYPE inventory_receipt_status AS ENUM ('PENDING', 'PARTIAL', 'RECEIVED');

ALTER TABLE thread_order_deliveries DROP CONSTRAINT IF EXISTS thread_order_deliveries_inventory_status_check;
ALTER TABLE thread_order_deliveries DROP CONSTRAINT IF EXISTS chk_inventory_status;

UPDATE thread_order_deliveries SET inventory_status = UPPER(inventory_status) WHERE inventory_status IS NOT NULL AND inventory_status != '';

ALTER TABLE thread_order_deliveries
  ALTER COLUMN inventory_status DROP DEFAULT,
  ALTER COLUMN inventory_status TYPE inventory_receipt_status USING inventory_status::inventory_receipt_status,
  ALTER COLUMN inventory_status SET DEFAULT 'PENDING';

NOTIFY pgrst, 'reload schema';

COMMIT;
