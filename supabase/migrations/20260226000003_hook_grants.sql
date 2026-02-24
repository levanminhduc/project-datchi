GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

GRANT SELECT ON TABLE public.employees TO supabase_auth_admin;
GRANT SELECT ON TABLE public.employee_roles TO supabase_auth_admin;
GRANT SELECT ON TABLE public.roles TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
