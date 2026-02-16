BEGIN;

ALTER TABLE batch_transactions
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE employee_permissions
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE employee_roles
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE system_settings
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_order_results
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE employee_refresh_tokens
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE role_permissions
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_allocation_cones
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_conflict_allocations
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_issue_lines
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_issue_return_logs
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_movements
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE thread_order_items
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE notifications
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TRIGGER trigger_batch_transactions_updated_at
  BEFORE UPDATE ON batch_transactions
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_employee_permissions_updated_at
  BEFORE UPDATE ON employee_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_employee_roles_updated_at
  BEFORE UPDATE ON employee_roles
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_employee_refresh_tokens_updated_at
  BEFORE UPDATE ON employee_refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_allocation_cones_updated_at
  BEFORE UPDATE ON thread_allocation_cones
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_conflict_allocations_updated_at
  BEFORE UPDATE ON thread_conflict_allocations
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_issue_lines_updated_at
  BEFORE UPDATE ON thread_issue_lines
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_issue_return_logs_updated_at
  BEFORE UPDATE ON thread_issue_return_logs
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_movements_updated_at
  BEFORE UPDATE ON thread_movements
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_order_items_updated_at
  BEFORE UPDATE ON thread_order_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trigger_thread_order_results_updated_at
  BEFORE UPDATE ON thread_order_results
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

ALTER TABLE colors ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE suppliers ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE styles ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE warehouses ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE thread_types ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE employees
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS refresh_token_expires_at;

COMMENT ON COLUMN thread_movements.cone_id IS 'FK to thread_inventory.id — represents the physical cone involved in this movement';
COMMENT ON COLUMN thread_recovery.cone_id IS 'FK to thread_inventory.id — represents the physical cone being recovered';
COMMENT ON COLUMN thread_allocation_cones.cone_id IS 'FK to thread_inventory.id — represents the physical cone allocated';

NOTIFY pgrst, 'reload schema';

COMMIT;
