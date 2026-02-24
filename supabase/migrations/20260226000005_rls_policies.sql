CREATE POLICY "authenticated_select_thread_inventory"
    ON thread_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select_thread_movements"
    ON thread_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select_thread_allocations"
    ON thread_allocations FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_all_lots"
    ON lots FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_purchase_orders"
    ON purchase_orders FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_thread_order_weeks"
    ON thread_order_weeks FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "warehouse_insert_thread_inventory"
    ON thread_inventory FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "warehouse_update_thread_inventory"
    ON thread_inventory FOR UPDATE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    )
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "warehouse_delete_thread_inventory"
    ON thread_inventory FOR DELETE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "warehouse_insert_thread_movements"
    ON thread_movements FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "warehouse_update_thread_movements"
    ON thread_movements FOR UPDATE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    )
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "warehouse_delete_thread_movements"
    ON thread_movements FOR DELETE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'warehouse_staff'
        OR auth.jwt() -> 'roles' ? 'warehouse_manager'
    );

CREATE POLICY "planning_insert_thread_allocations"
    ON thread_allocations FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'planning'
    );

CREATE POLICY "planning_update_thread_allocations"
    ON thread_allocations FOR UPDATE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'planning'
    )
    WITH CHECK (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'planning'
    );

CREATE POLICY "planning_delete_thread_allocations"
    ON thread_allocations FOR DELETE TO authenticated
    USING (
        (auth.jwt() -> 'is_root')::boolean = true
        OR auth.jwt() -> 'roles' ? 'admin'
        OR auth.jwt() -> 'roles' ? 'planning'
    );
