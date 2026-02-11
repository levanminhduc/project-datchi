-- ============================================================================
-- Migration: 20260210120001_create_issue_functions.sql
-- Description: Tao cac function va trigger cho xuat kho san xuat
-- Dependencies: thread_issue_requests, thread_issue_items, style_thread_specs, thread_order_items
-- ============================================================================

-- ============================================================================
-- FUNCTION: fn_generate_issue_code
-- Purpose: Auto-generate issue code in format XK-YYYYMMDD-NNN
-- Example: XK-20260210-001, XK-20260210-002
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_generate_issue_code()
RETURNS VARCHAR AS $$
DECLARE
    v_today DATE;
    v_date_str VARCHAR;
    v_count INTEGER;
    v_next_seq INTEGER;
    v_code VARCHAR;
BEGIN
    -- Get current date
    v_today := CURRENT_DATE;
    v_date_str := TO_CHAR(v_today, 'YYYYMMDD');

    -- Count existing codes for today
    SELECT COUNT(*) INTO v_count
    FROM thread_issue_requests
    WHERE issue_code LIKE 'XK-' || v_date_str || '-%';

    -- Calculate next sequence number
    v_next_seq := v_count + 1;

    -- Generate code with 3-digit sequence
    v_code := 'XK-' || v_date_str || '-' || LPAD(v_next_seq::TEXT, 3, '0');

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_issue_code IS 'Tao ma phieu xuat tu dong - Auto-generate issue code XK-YYYYMMDD-NNN';

-- ============================================================================
-- FUNCTION: fn_calculate_quota
-- Purpose: Calculate quota from style_thread_specs
-- Logic: order_quantity * meters_per_unit
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_calculate_quota(
    p_po_id INTEGER,
    p_style_id INTEGER,
    p_color_id INTEGER,
    p_thread_type_id INTEGER
)
RETURNS DECIMAL(12,4) AS $$
DECLARE
    v_order_quantity INTEGER;
    v_meters_per_unit DECIMAL(10,2);
    v_quota DECIMAL(12,4);
BEGIN
    -- Get order quantity from thread_order_items for this PO/style/color
    SELECT COALESCE(SUM(quantity), 0) INTO v_order_quantity
    FROM thread_order_items
    WHERE po_id = p_po_id
      AND style_id = p_style_id
      AND color_id = p_color_id;

    -- If no order found, return 0
    IF v_order_quantity = 0 THEN
        RETURN 0;
    END IF;

    -- Get meters_per_unit from style_thread_specs for this style/thread_type
    -- Join with style_color_thread_specs to get the thread_type mapping
    SELECT COALESCE(sts.meters_per_unit, 0) INTO v_meters_per_unit
    FROM style_thread_specs sts
    JOIN style_color_thread_specs scts ON scts.style_thread_spec_id = sts.id
    WHERE sts.style_id = p_style_id
      AND scts.thread_type_id = p_thread_type_id
    LIMIT 1;

    -- If no spec found, return 0
    IF v_meters_per_unit IS NULL OR v_meters_per_unit = 0 THEN
        RETURN 0;
    END IF;

    -- Calculate quota: order_quantity * meters_per_unit
    v_quota := v_order_quantity * v_meters_per_unit;

    RETURN v_quota;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_quota IS 'Tinh dinh muc chi (met) tu style_thread_specs - Calculate quota from BOM';

-- ============================================================================
-- FUNCTION: fn_check_quota
-- Purpose: Check remaining quota for a PO/Style/Color/ThreadType combination
-- Returns JSON with quota details
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_check_quota(
    p_po_id INTEGER,
    p_style_id INTEGER,
    p_color_id INTEGER,
    p_thread_type_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_quota_meters DECIMAL(12,4);
    v_issued_meters DECIMAL(12,4);
    v_remaining_meters DECIMAL(12,4);
    v_is_over_quota BOOLEAN;
BEGIN
    -- Get quota from fn_calculate_quota
    v_quota_meters := fn_calculate_quota(p_po_id, p_style_id, p_color_id, p_thread_type_id);

    -- Get total issued meters from all thread_issue_requests for same combination
    SELECT COALESCE(SUM(issued_meters), 0) INTO v_issued_meters
    FROM thread_issue_requests
    WHERE po_id = p_po_id
      AND style_id = p_style_id
      AND color_id = p_color_id
      AND thread_type_id = p_thread_type_id
      AND status != 'CANCELLED';

    -- Calculate remaining
    v_remaining_meters := v_quota_meters - v_issued_meters;

    -- Check if over quota
    v_is_over_quota := v_remaining_meters < 0;

    RETURN json_build_object(
        'quota_meters', v_quota_meters,
        'issued_meters', v_issued_meters,
        'remaining_meters', v_remaining_meters,
        'is_over_quota', v_is_over_quota
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_check_quota IS 'Kiem tra dinh muc con lai - Check remaining quota for issuance';

-- ============================================================================
-- FUNCTION: fn_update_issue_request_issued_meters
-- Purpose: Trigger function to update issued_meters on thread_issue_requests
-- Called after INSERT/DELETE on thread_issue_items
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_issue_request_issued_meters()
RETURNS TRIGGER AS $$
DECLARE
    v_request_id INTEGER;
    v_total_meters DECIMAL(12,4);
BEGIN
    -- Determine which request_id to update
    IF TG_OP = 'DELETE' THEN
        v_request_id := OLD.issue_request_id;
    ELSE
        v_request_id := NEW.issue_request_id;
    END IF;

    -- Calculate sum of all items for this request
    SELECT COALESCE(SUM(quantity_meters), 0) INTO v_total_meters
    FROM thread_issue_items
    WHERE issue_request_id = v_request_id;

    -- Update the request
    UPDATE thread_issue_requests
    SET issued_meters = v_total_meters,
        updated_at = NOW()
    WHERE id = v_request_id;

    RETURN NULL; -- AFTER trigger returns NULL
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_issue_request_issued_meters IS 'Cap nhat so met da xuat khi them/xoa item - Update issued_meters on item changes';

-- ============================================================================
-- TRIGGER: trigger_update_issue_request_issued_meters
-- After INSERT/DELETE on thread_issue_items
-- ============================================================================

CREATE TRIGGER trigger_update_issue_request_issued_meters
    AFTER INSERT OR DELETE ON thread_issue_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_issue_request_issued_meters();

-- ============================================================================
-- FUNCTION: fn_update_issue_request_status
-- Purpose: Trigger function to update status based on issued_meters
-- Called after UPDATE on thread_issue_requests.issued_meters
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_issue_request_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't change if status is CANCELLED
    IF NEW.status = 'CANCELLED' THEN
        RETURN NEW;
    END IF;

    -- Only process if issued_meters changed
    IF OLD.issued_meters IS DISTINCT FROM NEW.issued_meters THEN
        IF NEW.issued_meters = 0 THEN
            -- No items issued yet
            NEW.status := 'PENDING';
        ELSIF NEW.issued_meters > 0 AND NEW.issued_meters < NEW.requested_meters THEN
            -- Partially issued
            NEW.status := 'PARTIAL';
        ELSIF NEW.issued_meters >= NEW.requested_meters THEN
            -- Fully issued (or over-issued)
            NEW.status := 'COMPLETED';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_issue_request_status IS 'Tu dong cap nhat trang thai yeu cau xuat - Auto-update request status based on issued_meters';

-- ============================================================================
-- TRIGGER: trigger_update_issue_request_status
-- BEFORE UPDATE on thread_issue_requests
-- ============================================================================

CREATE TRIGGER trigger_update_issue_request_status
    BEFORE UPDATE ON thread_issue_requests
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_issue_request_status();

-- ============================================================================
-- TRIGGER: trigger_thread_issue_requests_updated_at
-- Standard updated_at trigger for thread_issue_requests
-- ============================================================================

CREATE TRIGGER trigger_thread_issue_requests_updated_at
    BEFORE UPDATE ON thread_issue_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
