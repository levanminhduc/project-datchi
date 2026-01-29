-- ============================================================================
-- Thread Management System - Thread Recovery Table
-- Migration: 005_thread_recovery.sql
-- Description: Partial cone recovery workflow - tracking returned cones from production
-- Dependencies: 002_thread_inventory.sql
-- ============================================================================

-- ============================================================================
-- ENUM: recovery_status
-- Represents the lifecycle states of a cone recovery process
-- ============================================================================

CREATE TYPE recovery_status AS ENUM (
    'INITIATED',      -- Cong nhan khoi tao tra - Worker initiated return
    'PENDING_WEIGH',  -- Cho can - Waiting for warehouse to weigh
    'WEIGHED',        -- Da can - Weight recorded, awaiting confirmation
    'CONFIRMED',      -- Da xac nhan - Recovery confirmed, cone back in inventory
    'WRITTEN_OFF',    -- Xoa so - Written off (< 50g or supervisor decision)
    'REJECTED'        -- Tu choi - Recovery rejected (quality issues, wrong cone)
);

-- Add enum comment
COMMENT ON TYPE recovery_status IS 'Recovery workflow states - Trang thai quy trinh thu hoi cuon le';

-- ============================================================================
-- TABLE: thread_recovery
-- Tracks partial cone returns from production back to inventory
-- Calculates consumption based on weight difference
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_recovery (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to the cone being recovered
    cone_id INTEGER NOT NULL REFERENCES thread_inventory(id),
    
    -- =========================================================================
    -- Quantity Tracking (Before/After)
    -- =========================================================================
    
    -- Meters when the cone was issued to production
    original_meters DECIMAL(12,4) NOT NULL,
    
    -- Weight when returned (measured by warehouse)
    returned_weight_grams DECIMAL(10,2),
    
    -- Meters calculated from returned weight using density factor
    -- Formula: (returned_weight_grams - tare_weight_grams) / density_factor * 1000
    calculated_meters DECIMAL(12,4),
    
    -- Empty cone weight (default 10g, can be adjusted per cone type)
    tare_weight_grams DECIMAL(10,2) DEFAULT 10,
    
    -- Consumption = original_meters - calculated_meters
    consumption_meters DECIMAL(12,4),
    
    -- =========================================================================
    -- Status Tracking
    -- =========================================================================
    
    status recovery_status DEFAULT 'INITIATED',
    
    -- =========================================================================
    -- Actors (Who performed each step)
    -- =========================================================================
    
    -- Worker who started the return process (production worker)
    initiated_by VARCHAR(100),
    
    -- Warehouse keeper who weighed the cone
    weighed_by VARCHAR(100),
    
    -- Supervisor who confirmed the recovery (especially for write-offs)
    confirmed_by VARCHAR(100),
    
    -- =========================================================================
    -- Additional Information
    -- =========================================================================
    
    -- Notes about the recovery (reason for write-off, etc.)
    notes TEXT,
    
    -- Optional verification photo URL (for dispute resolution)
    photo_url TEXT,
    
    -- =========================================================================
    -- Timestamps
    -- =========================================================================
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_recovery IS 'Partial cone recovery from production - Thu hoi cuon chi le tu san xuat';

-- Add column comments
COMMENT ON COLUMN thread_recovery.cone_id IS 'Reference to recovered cone - Cuon chi duoc thu hoi';
COMMENT ON COLUMN thread_recovery.original_meters IS 'Meters on cone when issued to production - So met khi xuat san xuat';
COMMENT ON COLUMN thread_recovery.returned_weight_grams IS 'Actual weight when returned (measured) - Khoi luong thuc te khi tra';
COMMENT ON COLUMN thread_recovery.calculated_meters IS 'Meters calculated from weight using density factor - So met tinh tu khoi luong';
COMMENT ON COLUMN thread_recovery.tare_weight_grams IS 'Empty cone weight (default 10g) - Khoi luong vo cuon';
COMMENT ON COLUMN thread_recovery.consumption_meters IS 'Meters consumed (original - calculated) - So met da su dung';
COMMENT ON COLUMN thread_recovery.status IS 'Current recovery status - Trang thai thu hoi';
COMMENT ON COLUMN thread_recovery.initiated_by IS 'Production worker who initiated return - Cong nhan khoi tao tra';
COMMENT ON COLUMN thread_recovery.weighed_by IS 'Warehouse keeper who weighed - Nguoi can';
COMMENT ON COLUMN thread_recovery.confirmed_by IS 'Supervisor who confirmed - Nguoi xac nhan';
COMMENT ON COLUMN thread_recovery.notes IS 'Additional notes or write-off reason - Ghi chu';
COMMENT ON COLUMN thread_recovery.photo_url IS 'Verification photo URL - Anh xac nhan';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- Uses existing function from 001_thread_types.sql
-- ============================================================================

CREATE TRIGGER update_thread_recovery_updated_at
    BEFORE UPDATE ON thread_recovery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Optimize common query patterns
-- ============================================================================

-- Lookup by cone (most common - find recovery record for a specific cone)
CREATE INDEX idx_recovery_cone ON thread_recovery(cone_id);

-- Filter by status (for status-based workflows)
CREATE INDEX idx_recovery_status ON thread_recovery(status);

-- Partial index for pending recoveries (warehouse dashboard)
-- These are the records that need attention
CREATE INDEX idx_recovery_pending ON thread_recovery(status) 
    WHERE status IN ('INITIATED', 'PENDING_WEIGH', 'WEIGHED');

-- Sort by created_at descending (most recent first for lists)
CREATE INDEX idx_recovery_created ON thread_recovery(created_at DESC);

-- ============================================================================
-- CONSTRAINT: Ensure original_meters is positive
-- ============================================================================

ALTER TABLE thread_recovery
ADD CONSTRAINT chk_thread_recovery_original_meters_positive 
CHECK (original_meters > 0);

-- ============================================================================
-- CONSTRAINT: Ensure returned_weight_grams is non-negative when set
-- ============================================================================

ALTER TABLE thread_recovery
ADD CONSTRAINT chk_thread_recovery_weight_non_negative 
CHECK (returned_weight_grams IS NULL OR returned_weight_grams >= 0);

-- ============================================================================
-- CONSTRAINT: Ensure tare_weight_grams is non-negative
-- ============================================================================

ALTER TABLE thread_recovery
ADD CONSTRAINT chk_thread_recovery_tare_non_negative 
CHECK (tare_weight_grams >= 0);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
