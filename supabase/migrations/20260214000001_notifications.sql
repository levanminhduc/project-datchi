CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_notification_type CHECK (
    type IN ('STOCK_ALERT', 'BATCH_RECEIVE', 'BATCH_ISSUE', 'ALLOCATION', 'CONFLICT', 'RECOVERY', 'WEEKLY_ORDER')
  )
);

CREATE INDEX idx_notifications_employee ON notifications(employee_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_composite ON notifications(employee_id, is_read, deleted_at);

CREATE OR REPLACE FUNCTION fn_notify_batch_movement()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  v_type VARCHAR(50);
  v_title VARCHAR(255);
  v_cone_id VARCHAR(50);
  v_thread_name VARCHAR(200);
  v_quantity DECIMAL(12,4);
BEGIN
  IF NEW.movement_type NOT IN ('RECEIVE', 'ISSUE') THEN
    RETURN NEW;
  END IF;

  SELECT ti.cone_id, tt.name
  INTO v_cone_id, v_thread_name
  FROM thread_inventory ti
  JOIN thread_types tt ON ti.thread_type_id = tt.id
  WHERE ti.id = NEW.cone_id;

  v_quantity := ABS(NEW.quantity_meters);

  IF NEW.movement_type = 'RECEIVE' THEN
    v_type := 'BATCH_RECEIVE';
    v_title := 'Nhập kho: ' || COALESCE(v_thread_name, '') || ' - ' || v_cone_id || ' (' || v_quantity || 'm)';
  ELSE
    v_type := 'BATCH_ISSUE';
    v_title := 'Xuất kho: ' || COALESCE(v_thread_name, '') || ' - ' || v_cone_id || ' (' || v_quantity || 'm)';
  END IF;

  FOR rec IN
    SELECT DISTINCT er.employee_id
    FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE r.level <= 2
       OR r.code IN ('root', 'admin', 'warehouse_manager')
  LOOP
    INSERT INTO notifications (employee_id, type, title, action_url, metadata)
    VALUES (
      rec.employee_id,
      v_type,
      v_title,
      '/thread/inventory',
      jsonb_build_object(
        'movement_id', NEW.id,
        'cone_id', v_cone_id,
        'thread_name', v_thread_name,
        'quantity_meters', v_quantity,
        'movement_type', NEW.movement_type::TEXT
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_batch_movement
  AFTER INSERT ON thread_movements
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_batch_movement();

CREATE OR REPLACE FUNCTION fn_notify_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  v_thread_type_id INTEGER;
  v_thread_name VARCHAR(200);
  v_thread_code VARCHAR(50);
  v_total_meters DECIMAL(12,4);
  v_reorder_level DECIMAL(12,2);
  v_has_recent BOOLEAN;
BEGIN
  SELECT ti.thread_type_id
  INTO v_thread_type_id
  FROM thread_inventory ti
  WHERE ti.id = NEW.cone_id;

  IF v_thread_type_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tt.name, tt.code, tt.reorder_level_meters
  INTO v_thread_name, v_thread_code, v_reorder_level
  FROM thread_types tt
  WHERE tt.id = v_thread_type_id;

  IF v_reorder_level IS NULL OR v_reorder_level <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(ti.quantity_meters), 0)
  INTO v_total_meters
  FROM thread_inventory ti
  WHERE ti.thread_type_id = v_thread_type_id
    AND ti.status = 'AVAILABLE';

  IF v_total_meters >= v_reorder_level THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.type = 'STOCK_ALERT'
      AND n.is_read = false
      AND n.deleted_at IS NULL
      AND n.metadata->>'thread_type_id' = v_thread_type_id::TEXT
      AND n.created_at > NOW() - INTERVAL '1 hour'
  ) INTO v_has_recent;

  IF v_has_recent THEN
    RETURN NEW;
  END IF;

  FOR rec IN
    SELECT DISTINCT er.employee_id
    FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE r.level <= 2
       OR r.code IN ('root', 'admin', 'warehouse_manager')
  LOOP
    INSERT INTO notifications (employee_id, type, title, body, action_url, metadata)
    VALUES (
      rec.employee_id,
      'STOCK_ALERT',
      'Cảnh báo tồn kho thấp: ' || COALESCE(v_thread_name, v_thread_code),
      'Tồn kho hiện tại: ' || ROUND(v_total_meters, 2) || 'm / Mức cảnh báo: ' || ROUND(v_reorder_level, 2) || 'm',
      '/thread/inventory',
      jsonb_build_object(
        'thread_type_id', v_thread_type_id,
        'thread_code', v_thread_code,
        'thread_name', v_thread_name,
        'current_meters', v_total_meters,
        'reorder_level', v_reorder_level
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_stock_alert
  AFTER INSERT ON thread_movements
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_stock_alert();

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
