BEGIN;

GRANT ALL ON TABLE public.thread_order_week_warehouses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.thread_order_week_warehouses TO authenticated;
GRANT SELECT ON TABLE public.thread_order_week_warehouses TO anon;

COMMIT;
