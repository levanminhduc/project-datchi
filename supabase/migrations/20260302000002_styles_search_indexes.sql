-- Migration: Add trigram indexes for styles search optimization
-- Supports ILIKE '%pattern%' with index scan instead of full table scan

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes for ILIKE search on style_code and style_name
CREATE INDEX IF NOT EXISTS idx_styles_style_code_trgm
ON styles USING gin (style_code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_styles_style_name_trgm
ON styles USING gin (style_name gin_trgm_ops);

-- Partial index for active styles (most queries filter deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_styles_active
ON styles (id) WHERE deleted_at IS NULL;
