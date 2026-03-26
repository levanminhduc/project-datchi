-- Migration: 20240101000014_warehouse_hierarchy.sql
-- Description: Add hierarchy support to warehouses table (LOCATION -> STORAGE)
-- Part of: Thread Management System - Warehouse Hierarchy Feature

-- ============================================================================
-- ADD HIERARCHY COLUMNS
-- ============================================================================

-- Add parent_id for self-referencing hierarchy (LOCATION has no parent, STORAGE has parent)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS parent_id INTEGER;

-- Add type column to distinguish LOCATION (site/địa điểm) from STORAGE (kho lưu trữ)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'STORAGE';

-- Add sort_order for custom ordering within same level
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Foreign key: parent_id references warehouses(id)
ALTER TABLE warehouses 
  ADD CONSTRAINT fk_warehouses_parent 
  FOREIGN KEY (parent_id) REFERENCES warehouses(id) ON DELETE SET NULL;

-- Check constraint: type must be LOCATION or STORAGE
ALTER TABLE warehouses 
  ADD CONSTRAINT chk_warehouses_type 
  CHECK (type IN ('LOCATION', 'STORAGE'));

-- Check constraint: prevent self-reference (parent_id cannot equal id)
ALTER TABLE warehouses 
  ADD CONSTRAINT chk_warehouses_no_self_parent 
  CHECK (parent_id IS NULL OR parent_id != id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for parent_id lookups (find children of a location)
CREATE INDEX IF NOT EXISTS idx_warehouses_parent ON warehouses(parent_id);

-- Index for type filtering (get only LOCATION or STORAGE)
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);

-- Index for ordering within hierarchy
CREATE INDEX IF NOT EXISTS idx_warehouses_sort ON warehouses(parent_id, sort_order);

-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Set existing warehouses to STORAGE type (they are actual storage locations)
UPDATE warehouses SET type = 'STORAGE' WHERE type IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN warehouses.parent_id IS 'Parent warehouse ID. NULL for LOCATION (top-level), references LOCATION for STORAGE';
COMMENT ON COLUMN warehouses.type IS 'Warehouse type: LOCATION (site/địa điểm) or STORAGE (kho lưu trữ thực tế)';
COMMENT ON COLUMN warehouses.sort_order IS 'Display order within same parent level (lower = first)';
