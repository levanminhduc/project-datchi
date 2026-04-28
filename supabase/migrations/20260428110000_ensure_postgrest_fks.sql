-- Đảm bảo tất cả FK cần thiết cho PostgREST nested select trong cone-summary endpoint
-- Query cần: thread_inventory -> thread_types -> suppliers, thread_inventory -> colors

-- 1. FK: thread_inventory.thread_type_id -> thread_types.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'thread_inventory'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) LIKE '%thread_types%'
  ) THEN
    ALTER TABLE thread_inventory
      ADD CONSTRAINT fk_thread_inventory_thread_type_id
      FOREIGN KEY (thread_type_id) REFERENCES thread_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 2. FK: thread_types.supplier_id -> suppliers.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'thread_types'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) LIKE '%suppliers%'
  ) THEN
    -- Set NULL cho supplier_id không hợp lệ trước
    UPDATE thread_types tt
    SET supplier_id = NULL
    WHERE tt.supplier_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.id = tt.supplier_id);

    ALTER TABLE thread_types
      ADD CONSTRAINT fk_thread_types_supplier_id
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
