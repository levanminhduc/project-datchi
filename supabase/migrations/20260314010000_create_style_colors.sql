-- ============================================================================
-- Migration: create style_colors table
-- Description: Tach mau hang (garment color) thanh bang rieng, con cua styles
-- Dependencies: styles, style_color_thread_specs, thread_order_items, skus
-- ============================================================================

-- 1. Tao bang style_colors
CREATE TABLE style_colors (
    id SERIAL PRIMARY KEY,
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    color_name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7) NOT NULL DEFAULT '#808080',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(style_id, color_name)
);

CREATE INDEX idx_style_colors_style_id ON style_colors(style_id);

CREATE TRIGGER trigger_style_colors_updated_at
    BEFORE UPDATE ON style_colors
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- 2. Seed data tu style_color_thread_specs
INSERT INTO style_colors (style_id, color_name, hex_code)
SELECT DISTINCT
    sts.style_id,
    c.name,
    c.hex_code
FROM style_color_thread_specs scts
JOIN style_thread_specs sts ON scts.style_thread_spec_id = sts.id
JOIN colors c ON scts.color_id = c.id
ON CONFLICT DO NOTHING;

-- Them cac color tu thread_order_items
INSERT INTO style_colors (style_id, color_name, hex_code)
SELECT DISTINCT
    toi.style_id,
    c.name,
    c.hex_code
FROM thread_order_items toi
JOIN colors c ON toi.color_id = c.id
ON CONFLICT (style_id, color_name) DO NOTHING;

-- Them cac color tu skus (qua po_items)
INSERT INTO style_colors (style_id, color_name, hex_code)
SELECT DISTINCT
    poi.style_id,
    c.name,
    c.hex_code
FROM skus s
JOIN po_items poi ON s.po_item_id = poi.id
JOIN colors c ON s.color_id = c.id
WHERE poi.style_id IS NOT NULL
ON CONFLICT (style_id, color_name) DO NOTHING;

-- 3. Add style_color_id FK to style_color_thread_specs
ALTER TABLE style_color_thread_specs
    ADD COLUMN style_color_id INTEGER REFERENCES style_colors(id) ON DELETE RESTRICT;

UPDATE style_color_thread_specs
SET style_color_id = sc.id
FROM style_thread_specs sts, style_colors sc, colors c
WHERE style_color_thread_specs.style_thread_spec_id = sts.id
  AND sc.style_id = sts.style_id
  AND c.id = style_color_thread_specs.color_id
  AND sc.color_name = c.name;

-- 4. Add style_color_id FK to thread_order_items
ALTER TABLE thread_order_items
    ADD COLUMN style_color_id INTEGER REFERENCES style_colors(id) ON DELETE RESTRICT;

UPDATE thread_order_items
SET style_color_id = sc.id
FROM style_colors sc, colors c
WHERE sc.style_id = thread_order_items.style_id
  AND c.id = thread_order_items.color_id
  AND sc.color_name = c.name;

-- 5. Add style_color_id FK to skus
ALTER TABLE skus
    ADD COLUMN style_color_id INTEGER REFERENCES style_colors(id) ON DELETE RESTRICT;

UPDATE skus
SET style_color_id = sc.id
FROM po_items poi, style_colors sc, colors c
WHERE skus.po_item_id = poi.id
  AND poi.style_id IS NOT NULL
  AND sc.style_id = poi.style_id
  AND c.id = skus.color_id
  AND sc.color_name = c.name;

-- 6. Indexes on new FK columns
CREATE INDEX idx_scts_style_color_id ON style_color_thread_specs(style_color_id);
CREATE INDEX idx_toi_style_color_id ON thread_order_items(style_color_id);
CREATE INDEX idx_skus_style_color_id ON skus(style_color_id);

-- 7. Update unique constraint on style_color_thread_specs
ALTER TABLE style_color_thread_specs
    DROP CONSTRAINT IF EXISTS style_color_thread_specs_style_thread_spec_id_color_id_key;
ALTER TABLE style_color_thread_specs
    ADD CONSTRAINT style_color_thread_specs_spec_style_color_key
    UNIQUE(style_thread_spec_id, style_color_id);

-- 8. Update unique index on thread_order_items (uses COALESCE, so it's a unique INDEX not constraint)
DROP INDEX IF EXISTS thread_order_items_week_po_style_color_subart_key;
CREATE UNIQUE INDEX thread_order_items_week_po_style_color_subart_key
  ON thread_order_items (week_id, COALESCE(po_id, 0), style_id, style_color_id, COALESCE(sub_art_id, 0));

-- 9. Make old color_id nullable (backward compat, drop later)
ALTER TABLE style_color_thread_specs ALTER COLUMN color_id DROP NOT NULL;
ALTER TABLE thread_order_items ALTER COLUMN color_id DROP NOT NULL;
ALTER TABLE skus ALTER COLUMN color_id DROP NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
