BEGIN;

DROP TRIGGER IF EXISTS trigger_sync_lot_on_inventory_change ON thread_inventory;

CREATE OR REPLACE FUNCTION fn_sync_lot_available_cones()
RETURNS TRIGGER AS $$
DECLARE
  v_old_lot_id INTEGER;
  v_new_lot_id INTEGER;
  v_count INTEGER;
  v_current_status lot_status;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_lot_id := OLD.lot_id;
    v_new_lot_id := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_lot_id := NULL;
    v_new_lot_id := NEW.lot_id;
  ELSE
    v_old_lot_id := OLD.lot_id;
    v_new_lot_id := NEW.lot_id;

    IF v_old_lot_id IS NOT DISTINCT FROM v_new_lot_id
       AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
  END IF;

  IF v_old_lot_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM thread_inventory
    WHERE lot_id = v_old_lot_id
      AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED');

    SELECT status INTO v_current_status
    FROM lots
    WHERE id = v_old_lot_id;

    UPDATE lots
    SET
      available_cones = v_count,
      status = CASE
        WHEN v_count = 0 AND v_current_status NOT IN ('QUARANTINE', 'EXPIRED') THEN 'DEPLETED'::lot_status
        WHEN v_count > 0 AND v_current_status = 'DEPLETED' THEN 'ACTIVE'::lot_status
        ELSE v_current_status
      END,
      updated_at = NOW()
    WHERE id = v_old_lot_id;
  END IF;

  IF v_new_lot_id IS NOT NULL AND v_new_lot_id IS DISTINCT FROM v_old_lot_id THEN
    SELECT COUNT(*) INTO v_count
    FROM thread_inventory
    WHERE lot_id = v_new_lot_id
      AND status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED');

    SELECT status INTO v_current_status
    FROM lots
    WHERE id = v_new_lot_id;

    UPDATE lots
    SET
      available_cones = v_count,
      status = CASE
        WHEN v_count = 0 AND v_current_status NOT IN ('QUARANTINE', 'EXPIRED') THEN 'DEPLETED'::lot_status
        WHEN v_count > 0 AND v_current_status = 'DEPLETED' THEN 'ACTIVE'::lot_status
        ELSE v_current_status
      END,
      updated_at = NOW()
    WHERE id = v_new_lot_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_lot_on_inventory_change
  AFTER INSERT OR UPDATE OR DELETE ON thread_inventory
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_lot_available_cones();

NOTIFY pgrst, 'reload schema';

COMMIT;
