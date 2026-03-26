BEGIN;

ALTER FUNCTION public.allocate_thread(
  p_order_id character varying,
  p_order_reference character varying,
  p_thread_type_id integer,
  p_requested_meters numeric,
  p_priority allocation_priority,
  p_due_date date,
  p_notes text,
  p_created_by character varying
) RENAME TO fn_allocate_thread;

ALTER FUNCTION public.issue_cone(
  p_allocation_id integer,
  p_confirmed_by character varying
) RENAME TO fn_issue_cone;

ALTER FUNCTION public.recover_cone(
  p_cone_id integer,
  p_returned_weight_grams numeric,
  p_tare_weight_grams numeric,
  p_notes text,
  p_weighed_by character varying,
  p_confirmed_by character varying
) RENAME TO fn_recover_cone;

ALTER FUNCTION public.split_allocation(
  p_allocation_id integer,
  p_split_meters numeric,
  p_split_reason text
) RENAME TO fn_split_allocation;

ALTER FUNCTION public.cleanup_expired_refresh_tokens() RENAME TO fn_cleanup_expired_refresh_tokens;

ALTER FUNCTION public.is_admin(p_employee_id integer) RENAME TO fn_is_admin;
ALTER FUNCTION public.is_root(p_employee_id integer) RENAME TO fn_is_root;
ALTER FUNCTION public.can_manage_employee(actor_id integer, target_id integer) RENAME TO fn_can_manage_employee;

CREATE OR REPLACE FUNCTION public.fn_has_permission(p_employee_id integer, requested_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  IF public.fn_is_root(p_employee_id) THEN
    RETURN true;
  END IF;

  SELECT granted INTO has_perm
  FROM employee_permissions ep
  JOIN permissions p ON ep.permission_id = p.id
  WHERE ep.employee_id = p_employee_id
    AND p.code = requested_permission
    AND (ep.expires_at IS NULL OR ep.expires_at > NOW());

  IF has_perm IS NOT NULL THEN
    RETURN has_perm;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id
      AND p.code = requested_permission
  ) INTO has_perm;

  RETURN COALESCE(has_perm, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_has_any_permission(p_employee_id integer, requested_permissions text[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  IF public.fn_is_root(p_employee_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(requested_permissions) AS perm
    WHERE public.fn_has_permission(p_employee_id, perm)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_get_employee_permissions(p_employee_id integer)
 RETURNS TABLE(permission_code text, granted boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  IF public.fn_is_root(p_employee_id) THEN
    RETURN QUERY SELECT '*'::TEXT, true;
    RETURN;
  END IF;

  RETURN QUERY
  WITH role_perms AS (
    SELECT DISTINCT p.code, true as granted
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id
  ),
  direct_perms AS (
    SELECT p.code, ep.granted
    FROM employee_permissions ep
    JOIN permissions p ON ep.permission_id = p.id
    WHERE ep.employee_id = p_employee_id
      AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
  )
  SELECT COALESCE(dp.code, rp.code), COALESCE(dp.granted, rp.granted)
  FROM role_perms rp
  FULL OUTER JOIN direct_perms dp ON rp.code = dp.code
  WHERE COALESCE(dp.granted, rp.granted) = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_get_employee_roles(p_employee_id integer)
 RETURNS TABLE(role_code text, role_name text, role_level integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.code::TEXT, r.name::TEXT, r.level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = p_employee_id
  ORDER BY r.level;
END;
$function$;

DROP FUNCTION IF EXISTS public.has_permission(integer, text);
DROP FUNCTION IF EXISTS public.has_any_permission(integer, text[]);
DROP FUNCTION IF EXISTS public.get_employee_permissions(integer);
DROP FUNCTION IF EXISTS public.get_employee_roles(integer);

ALTER FUNCTION public.thread_audit_trigger_func() RENAME TO fn_thread_audit_trigger_func;
ALTER FUNCTION public.update_lots_updated_at() RENAME TO fn_update_lots_updated_at;
ALTER FUNCTION public.update_updated_at_column() RENAME TO fn_update_updated_at_column;

DROP TRIGGER IF EXISTS audit_thread_allocations ON thread_allocations;
CREATE TRIGGER audit_thread_allocations
  AFTER INSERT OR UPDATE OR DELETE ON thread_allocations
  FOR EACH ROW EXECUTE FUNCTION fn_thread_audit_trigger_func();

DROP TRIGGER IF EXISTS audit_thread_inventory ON thread_inventory;
CREATE TRIGGER audit_thread_inventory
  AFTER INSERT OR UPDATE OR DELETE ON thread_inventory
  FOR EACH ROW EXECUTE FUNCTION fn_thread_audit_trigger_func();

DROP TRIGGER IF EXISTS audit_thread_recovery ON thread_recovery;
CREATE TRIGGER audit_thread_recovery
  AFTER INSERT OR UPDATE OR DELETE ON thread_recovery
  FOR EACH ROW EXECUTE FUNCTION fn_thread_audit_trigger_func();

DROP TRIGGER IF EXISTS audit_thread_types ON thread_types;
CREATE TRIGGER audit_thread_types
  AFTER INSERT OR UPDATE OR DELETE ON thread_types
  FOR EACH ROW EXECUTE FUNCTION fn_thread_audit_trigger_func();

DROP TRIGGER IF EXISTS trigger_lots_updated_at ON lots;
CREATE TRIGGER trigger_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION fn_update_lots_updated_at();

DROP TRIGGER IF EXISTS trigger_color_supplier_updated_at ON color_supplier;
CREATE TRIGGER trigger_color_supplier_updated_at
  BEFORE UPDATE ON color_supplier
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_colors_updated_at ON colors;
CREATE TRIGGER trigger_colors_updated_at
  BEFORE UPDATE ON colors
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER trigger_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_po_items_updated_at ON po_items;
CREATE TRIGGER trigger_po_items_updated_at
  BEFORE UPDATE ON po_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER trigger_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_skus_updated_at ON skus;
CREATE TRIGGER trigger_skus_updated_at
  BEFORE UPDATE ON skus
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_style_color_thread_specs_updated_at ON style_color_thread_specs;
CREATE TRIGGER trigger_style_color_thread_specs_updated_at
  BEFORE UPDATE ON style_color_thread_specs
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_style_thread_specs_updated_at ON style_thread_specs;
CREATE TRIGGER trigger_style_thread_specs_updated_at
  BEFORE UPDATE ON style_thread_specs
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_styles_updated_at ON styles;
CREATE TRIGGER trigger_styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON system_settings;
CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_thread_allocations_updated_at ON thread_allocations;
CREATE TRIGGER trigger_thread_allocations_updated_at
  BEFORE UPDATE ON thread_allocations
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_thread_conflicts_updated_at ON thread_conflicts;
CREATE TRIGGER trigger_thread_conflicts_updated_at
  BEFORE UPDATE ON thread_conflicts
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_thread_inventory_updated_at ON thread_inventory;
CREATE TRIGGER trigger_thread_inventory_updated_at
  BEFORE UPDATE ON thread_inventory
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_issue_requests_updated_at ON thread_issue_requests;
CREATE TRIGGER trigger_thread_issue_requests_updated_at
  BEFORE UPDATE ON thread_issue_requests
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_issues_updated_at ON thread_issues;
CREATE TRIGGER trigger_thread_issues_updated_at
  BEFORE UPDATE ON thread_issues
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_order_deliveries_updated_at ON thread_order_deliveries;
CREATE TRIGGER trigger_thread_order_deliveries_updated_at
  BEFORE UPDATE ON thread_order_deliveries
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_order_weeks_updated_at ON thread_order_weeks;
CREATE TRIGGER trigger_thread_order_weeks_updated_at
  BEFORE UPDATE ON thread_order_weeks
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_thread_recovery_updated_at ON thread_recovery;
CREATE TRIGGER trigger_thread_recovery_updated_at
  BEFORE UPDATE ON thread_recovery
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_stock_updated_at ON thread_stock;
CREATE TRIGGER trigger_thread_stock_updated_at
  BEFORE UPDATE ON thread_stock
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_thread_type_supplier_updated_at ON thread_type_supplier;
CREATE TRIGGER trigger_thread_type_supplier_updated_at
  BEFORE UPDATE ON thread_type_supplier
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_thread_types_updated_at ON thread_types;
CREATE TRIGGER trigger_thread_types_updated_at
  BEFORE UPDATE ON thread_types
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER trigger_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notify_batch_movement ON thread_movements;
CREATE TRIGGER trigger_notify_batch_movement
  AFTER INSERT ON thread_movements
  FOR EACH ROW EXECUTE FUNCTION fn_notify_batch_movement();

DROP TRIGGER IF EXISTS trg_notify_stock_alert ON thread_movements;
CREATE TRIGGER trigger_notify_stock_alert
  AFTER INSERT ON thread_movements
  FOR EACH ROW EXECUTE FUNCTION fn_notify_stock_alert();

DROP TRIGGER IF EXISTS trigger_update_issue_request_issued_meters ON thread_issue_items;
CREATE TRIGGER trigger_update_issue_request_issued_meters
  AFTER INSERT OR DELETE ON thread_issue_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_issue_request_issued_meters();

DROP TRIGGER IF EXISTS trigger_update_issue_request_status ON thread_issue_requests;
CREATE TRIGGER trigger_update_issue_request_status
  BEFORE UPDATE ON thread_issue_requests
  FOR EACH ROW EXECUTE FUNCTION fn_update_issue_request_status();

NOTIFY pgrst, 'reload schema';

COMMIT;
