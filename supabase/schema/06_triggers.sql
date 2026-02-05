-- Triggers for Thread Inventory System
CREATE TRIGGER trigger_color_supplier_updated_at BEFORE DELETE ON public.color_supplier FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_colors_updated_at BEFORE DELETE ON public.colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_lots_updated_at BEFORE DELETE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_lots_updated_at();
CREATE TRIGGER trigger_suppliers_updated_at BEFORE DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_thread_allocations AFTER INSERT OR UPDATE OR DELETE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
CREATE TRIGGER update_thread_allocations_updated_at BEFORE DELETE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_thread_conflicts_updated_at BEFORE DELETE ON public.thread_conflicts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_thread_inventory AFTER INSERT OR UPDATE OR DELETE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
CREATE TRIGGER update_thread_inventory_updated_at BEFORE DELETE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_thread_recovery AFTER INSERT OR UPDATE OR DELETE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
CREATE TRIGGER update_thread_recovery_updated_at BEFORE DELETE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_thread_types AFTER INSERT OR UPDATE OR DELETE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
CREATE TRIGGER update_thread_types_updated_at BEFORE DELETE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE DELETE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
