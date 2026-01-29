-- Migration: 008_warehouses.sql
-- Description: Create warehouses table for storage locations
-- Part of: Thread Management System - Phase 1 Foundation

-- Warehouses table (storage locations)
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,           -- Warehouse code (e.g., 'WH-01')
  name VARCHAR(100) NOT NULL,                 -- Display name
  location VARCHAR(200),                      -- Physical location/address
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at (reuse existing function from positions table)
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

-- Add comment for table documentation
COMMENT ON TABLE warehouses IS 'Storage locations for thread inventory management';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse code (e.g., WH-01, WH-MAIN)';
COMMENT ON COLUMN warehouses.name IS 'Display name for the warehouse';
COMMENT ON COLUMN warehouses.location IS 'Physical address or location description';
COMMENT ON COLUMN warehouses.is_active IS 'Whether the warehouse is currently active';
