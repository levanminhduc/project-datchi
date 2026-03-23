-- Migration: 20260206215302_add_display_order_to_style_thread_specs.sql
-- Description: Add display_order column for persistent row ordering
-- Author: OpenSpec

-- Step 1: Add column with default value
ALTER TABLE style_thread_specs 
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Step 2: Populate existing rows with sequential display_order per style_id
-- Rows are ordered by created_at DESC (newest first gets display_order=0)
-- This preserves the current visual order
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY style_id ORDER BY created_at DESC) - 1 AS new_order
  FROM style_thread_specs
)
UPDATE style_thread_specs 
SET display_order = ranked.new_order
FROM ranked 
WHERE style_thread_specs.id = ranked.id;

-- Step 3: Add index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_style_thread_specs_display_order 
ON style_thread_specs(style_id, display_order);

-- Comments
COMMENT ON COLUMN style_thread_specs.display_order IS 'Display order within same style (lower = higher in list, 0 = first)';
