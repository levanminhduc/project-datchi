-- ============================================================================
-- Migration: 20260313000001_add_sub_art_id_to_thread_order_items.sql
-- Description: Them cot sub_art_id vao thread_order_items de luu sub-article
--              cho tung dong dat hang chi tuan
-- Dependencies: sub_arts, thread_order_items
-- ============================================================================

-- SECTION 1: Them cot sub_art_id (nullable)
ALTER TABLE thread_order_items
  ADD COLUMN sub_art_id INTEGER REFERENCES sub_arts(id) ON DELETE RESTRICT;

COMMENT ON COLUMN thread_order_items.sub_art_id IS 'FK den sub_arts - Sub-article (nullable, chi khi ma hang co sub_arts)';

CREATE INDEX idx_thread_order_items_sub_art_id ON thread_order_items(sub_art_id);

-- SECTION 2: Xoa constraint cu (week_id, po_id, style_id, color_id)
ALTER TABLE thread_order_items
  DROP CONSTRAINT thread_order_items_week_po_style_color_key;

-- SECTION 3: Tao unique index moi voi COALESCE de xu ly NULL
-- COALESCE(po_id, 0) va COALESCE(sub_art_id, 0) dam bao NULL duoc coi nhu 0
-- cho muc dich unique constraint
CREATE UNIQUE INDEX thread_order_items_week_po_style_color_subart_key
  ON thread_order_items (week_id, COALESCE(po_id, 0), style_id, color_id, COALESCE(sub_art_id, 0));

-- SECTION 4: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
