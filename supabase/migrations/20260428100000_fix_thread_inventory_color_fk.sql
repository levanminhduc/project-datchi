-- Fix: Thêm FK constraint cho thread_inventory.color_id để PostgREST nhận biết relationship
-- Cần thiết cho endpoint /api/batch/transfer-history/:id/cone-summary

-- Bước 1: Set NULL cho các color_id không hợp lệ (nếu có)
UPDATE thread_inventory ti
SET color_id = NULL
WHERE ti.color_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM colors c WHERE c.id = ti.color_id);

-- Bước 2: Thêm FK constraint nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'thread_inventory'::regclass
    AND contype = 'f'
    AND conname = 'fk_thread_inventory_color_id'
  ) THEN
    ALTER TABLE thread_inventory
      ADD CONSTRAINT fk_thread_inventory_color_id
      FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Bước 3: Tạo index nếu chưa có
CREATE INDEX IF NOT EXISTS idx_thread_inventory_color ON thread_inventory(color_id);

-- Bước 4: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
