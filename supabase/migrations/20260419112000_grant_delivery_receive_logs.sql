BEGIN;

GRANT ALL ON TABLE public.delivery_receive_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.delivery_receive_logs TO authenticated;
GRANT SELECT ON TABLE public.delivery_receive_logs TO anon;

GRANT USAGE, SELECT ON SEQUENCE public.delivery_receive_logs_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.delivery_receive_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.delivery_receive_logs_id_seq TO anon;

COMMIT;
