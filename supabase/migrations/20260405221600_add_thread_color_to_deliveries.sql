-- Add thread_color and thread_color_code to thread_order_deliveries
-- to distinguish rows that share the same thread_type_id but have different colors
-- (caused by fallback thread types in weekly order calculations).

ALTER TABLE thread_order_deliveries
  ADD COLUMN thread_color VARCHAR(100) DEFAULT NULL,
  ADD COLUMN thread_color_code VARCHAR(20) DEFAULT NULL;

-- Drop old unique constraint that only uses thread_type_id
ALTER TABLE thread_order_deliveries
  DROP CONSTRAINT IF EXISTS thread_order_deliveries_week_id_thread_type_id_key;

-- Create new unique index using COALESCE so that NULL thread_color is treated as ''
CREATE UNIQUE INDEX thread_order_deliveries_week_thread_color_key
  ON thread_order_deliveries (week_id, thread_type_id, COALESCE(thread_color, ''));
