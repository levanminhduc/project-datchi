-- ============================================================================
-- Thread Management System - Thread Audit Log + Triggers
-- Migration: 007_thread_audit.sql
-- Description: Audit log table for tracking changes to thread-related tables
-- Dependencies: 001_thread_types.sql, 002_thread_inventory.sql, 
--               003_thread_allocations.sql, 005_thread_recovery.sql
-- ============================================================================

-- ============================================================================
-- TABLE: thread_audit_log
-- Central audit log tracking all changes to thread-related tables
-- Stores old/new values as JSONB for flexible querying
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_audit_log (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Reference information
    table_name VARCHAR(50) NOT NULL,             -- Ten bang bi thay doi
    record_id INTEGER NOT NULL,                   -- ID ban ghi bi thay doi
    action VARCHAR(10) NOT NULL,                  -- Loai thao tac: INSERT, UPDATE, DELETE
    
    -- =========================================================================
    -- Change Data Capture
    -- =========================================================================
    old_values JSONB,                             -- Gia tri cu (truoc thay doi)
    new_values JSONB,                             -- Gia tri moi (sau thay doi)
    changed_fields TEXT[],                        -- Danh sach cot da thay doi
    
    -- =========================================================================
    -- Actor Information
    -- =========================================================================
    performed_by VARCHAR(100),                    -- Nguoi thuc hien
    ip_address VARCHAR(45),                       -- Dia chi IP (IPv4/IPv6)
    user_agent TEXT,                              -- Trinh duyet/ung dung
    
    -- =========================================================================
    -- Timestamp
    -- =========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_audit_log IS 'Audit log for thread management tables - Nhat ky kiem toan cho cac bang quan ly chi';

-- Add column comments
COMMENT ON COLUMN thread_audit_log.table_name IS 'Name of the table that was changed - Ten bang bi thay doi';
COMMENT ON COLUMN thread_audit_log.record_id IS 'ID of the record that was changed - ID ban ghi bi thay doi';
COMMENT ON COLUMN thread_audit_log.action IS 'Type of action: INSERT, UPDATE, DELETE - Loai thao tac';
COMMENT ON COLUMN thread_audit_log.old_values IS 'Previous state as JSONB - Trang thai truoc dang JSONB';
COMMENT ON COLUMN thread_audit_log.new_values IS 'New state as JSONB - Trang thai moi dang JSONB';
COMMENT ON COLUMN thread_audit_log.changed_fields IS 'Array of column names that changed - Mang ten cot da thay doi';
COMMENT ON COLUMN thread_audit_log.performed_by IS 'User who performed the action - Nguoi thuc hien thao tac';
COMMENT ON COLUMN thread_audit_log.ip_address IS 'IP address of the actor (IPv4 or IPv6) - Dia chi IP';
COMMENT ON COLUMN thread_audit_log.user_agent IS 'Browser or application user agent - Trinh duyet/ung dung';

-- ============================================================================
-- FUNCTION: thread_audit_trigger_func
-- Generic audit trigger function that works for all tables
-- Detects which columns changed and logs INSERT/UPDATE/DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION thread_audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Log DELETE operation with old values only
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            old_values
        )
        VALUES (
            TG_TABLE_NAME, 
            OLD.id, 
            'DELETE', 
            to_jsonb(OLD)
        );
        RETURN OLD;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log UPDATE operation with old values, new values, and changed fields
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            old_values, 
            new_values, 
            changed_fields
        )
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            -- Calculate which fields changed using JSON comparison
            ARRAY(
                SELECT key
                FROM jsonb_each(to_jsonb(OLD)) old_kv
                FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) new_kv USING (key)
                WHERE old_kv.value IS DISTINCT FROM new_kv.value
            )
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Log INSERT operation with new values only
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            new_values
        )
        VALUES (
            TG_TABLE_NAME, 
            NEW.id, 
            'INSERT', 
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION thread_audit_trigger_func() IS 'Generic audit trigger function for thread tables - Ham trigger kiem toan chung cho cac bang chi';

-- ============================================================================
-- TRIGGERS: Attach audit function to thread tables
-- Each trigger fires AFTER INSERT, UPDATE, or DELETE on the respective table
-- ============================================================================

-- Audit trigger for thread_types table
CREATE TRIGGER audit_thread_types
    AFTER INSERT OR UPDATE OR DELETE ON thread_types
    FOR EACH ROW EXECUTE FUNCTION thread_audit_trigger_func();

-- Audit trigger for thread_inventory table
CREATE TRIGGER audit_thread_inventory
    AFTER INSERT OR UPDATE OR DELETE ON thread_inventory
    FOR EACH ROW EXECUTE FUNCTION thread_audit_trigger_func();

-- Audit trigger for thread_allocations table
CREATE TRIGGER audit_thread_allocations
    AFTER INSERT OR UPDATE OR DELETE ON thread_allocations
    FOR EACH ROW EXECUTE FUNCTION thread_audit_trigger_func();

-- Audit trigger for thread_recovery table
CREATE TRIGGER audit_thread_recovery
    AFTER INSERT OR UPDATE OR DELETE ON thread_recovery
    FOR EACH ROW EXECUTE FUNCTION thread_audit_trigger_func();

-- Add trigger comments
COMMENT ON TRIGGER audit_thread_types ON thread_types IS 'Audit trigger for thread types - Trigger kiem toan loai chi';
COMMENT ON TRIGGER audit_thread_inventory ON thread_inventory IS 'Audit trigger for inventory - Trigger kiem toan ton kho';
COMMENT ON TRIGGER audit_thread_allocations ON thread_allocations IS 'Audit trigger for allocations - Trigger kiem toan phan bo';
COMMENT ON TRIGGER audit_thread_recovery ON thread_recovery IS 'Audit trigger for recovery - Trigger kiem toan thu hoi';

-- ============================================================================
-- INDEXES: Optimize common query patterns for audit log
-- ============================================================================

-- Filter by table name (view audit history for specific table)
CREATE INDEX idx_audit_table ON thread_audit_log(table_name);

-- Filter by table + record ID (view audit history for specific record)
CREATE INDEX idx_audit_record ON thread_audit_log(table_name, record_id);

-- Filter by action type (view all INSERTs, UPDATEs, or DELETEs)
CREATE INDEX idx_audit_action ON thread_audit_log(action);

-- Sort by creation time descending (most recent changes first)
CREATE INDEX idx_audit_created ON thread_audit_log(created_at DESC);

-- Add index comments
COMMENT ON INDEX idx_audit_table IS 'Filter audit logs by table name - Loc theo ten bang';
COMMENT ON INDEX idx_audit_record IS 'Filter audit logs by table + record ID - Loc theo bang va ID';
COMMENT ON INDEX idx_audit_action IS 'Filter audit logs by action type - Loc theo loai thao tac';
COMMENT ON INDEX idx_audit_created IS 'Sort audit logs by creation time - Sap xep theo thoi gian';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
