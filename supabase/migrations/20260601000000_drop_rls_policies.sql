-- Forward migration: remove Row Level Security (supersedes
-- 20260226000004_enable_rls and 20260226000005_rls_policies).
--
-- Rationale (W1 Supabase -> PostgreSQL): the pg connection uses a privileged
-- application role and authorization is enforced in application code via
-- requirePermission on every route, so RLS is redundant.
--
-- SAFETY: this migration ONLY drops policies and disables RLS. It performs NO
-- DROP TABLE and deletes NO data row. It is idempotent (DROP POLICY IF EXISTS,
-- and a catch-all that drops any remaining public policy), so it runs clean
-- even on a database where the named policies failed to load (e.g. the target
-- `datchi` instance, where Supabase roles were absent at restore time).

-- 1. Drop the named policies from 20260226000005_rls_policies (idempotent).
DROP POLICY IF EXISTS "authenticated_select_thread_inventory" ON thread_inventory;
DROP POLICY IF EXISTS "authenticated_select_thread_movements" ON thread_movements;
DROP POLICY IF EXISTS "authenticated_select_thread_allocations" ON thread_allocations;
DROP POLICY IF EXISTS "authenticated_all_lots" ON lots;
DROP POLICY IF EXISTS "authenticated_all_purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "authenticated_all_thread_order_weeks" ON thread_order_weeks;
DROP POLICY IF EXISTS "warehouse_insert_thread_inventory" ON thread_inventory;
DROP POLICY IF EXISTS "warehouse_update_thread_inventory" ON thread_inventory;
DROP POLICY IF EXISTS "warehouse_delete_thread_inventory" ON thread_inventory;
DROP POLICY IF EXISTS "warehouse_insert_thread_movements" ON thread_movements;
DROP POLICY IF EXISTS "warehouse_update_thread_movements" ON thread_movements;
DROP POLICY IF EXISTS "warehouse_delete_thread_movements" ON thread_movements;
DROP POLICY IF EXISTS "planning_insert_thread_allocations" ON thread_allocations;
DROP POLICY IF EXISTS "planning_update_thread_allocations" ON thread_allocations;
DROP POLICY IF EXISTS "planning_delete_thread_allocations" ON thread_allocations;

-- 2. Catch-all: drop ANY remaining policy on ANY table in the public schema,
--    then disable RLS on every public table that still has it enabled. This
--    covers policies/tables beyond the two named migrations without touching
--    data.
DO $$
DECLARE
    pol RECORD;
    tbl RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename
        );
    END LOOP;

    FOR tbl IN
        SELECT n.nspname AS schemaname, c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY',
            tbl.schemaname, tbl.tablename
        );
        EXECUTE format(
            'ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY',
            tbl.schemaname, tbl.tablename
        );
    END LOOP;
END $$;
