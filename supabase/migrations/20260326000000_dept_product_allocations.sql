-- Dept Product Allocations: per-department quota tracking for PO/style/color combinations

CREATE TABLE dept_product_allocations (
  id SERIAL PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
  style_id INTEGER NOT NULL REFERENCES styles(id),
  style_color_id INTEGER NOT NULL REFERENCES style_colors(id),
  department VARCHAR(100) NOT NULL,
  product_quantity INTEGER NOT NULL CHECK (product_quantity > 0),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_dept_alloc_active
  ON dept_product_allocations(po_id, style_id, style_color_id, department)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_dept_alloc_po_style_color ON dept_product_allocations(po_id, style_id, style_color_id);
CREATE INDEX idx_dept_alloc_department ON dept_product_allocations(department);

CREATE TRIGGER trg_dept_product_allocations_updated_at
  BEFORE UPDATE ON dept_product_allocations
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

-- -------------------------------------------------------

CREATE TABLE dept_product_allocation_logs (
  id SERIAL PRIMARY KEY,
  allocation_id INTEGER NOT NULL REFERENCES dept_product_allocations(id) ON DELETE CASCADE,
  added_quantity INTEGER NOT NULL CHECK (added_quantity > 0),
  total_after INTEGER NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dept_alloc_logs_allocation ON dept_product_allocation_logs(allocation_id);

-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_dept_allocate(
  p_po_id INTEGER,
  p_style_id INTEGER,
  p_style_color_id INTEGER,
  p_department VARCHAR,
  p_add_quantity INTEGER,
  p_created_by VARCHAR
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_total_product_qty INTEGER;
  v_current_allocated INTEGER;
  v_allocation dept_product_allocations%ROWTYPE;
  v_new_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(toi.quantity), 0) INTO v_total_product_qty
  FROM thread_order_items toi
  JOIN thread_order_weeks tow ON tow.id = toi.week_id
  WHERE tow.status = 'CONFIRMED'
    AND toi.po_id = p_po_id
    AND toi.style_id = p_style_id
    AND toi.style_color_id = p_style_color_id;

  IF v_total_product_qty = 0 THEN
    RAISE EXCEPTION 'Chua co tuan hang xac nhan cho don hang nay';
  END IF;

  SELECT COALESCE(SUM(product_quantity), 0) INTO v_current_allocated
  FROM dept_product_allocations
  WHERE po_id = p_po_id
    AND style_id = p_style_id
    AND style_color_id = p_style_color_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_current_allocated + p_add_quantity > v_total_product_qty THEN
    RAISE EXCEPTION 'Vuot qua tong san pham. Con lai: %', v_total_product_qty - v_current_allocated;
  END IF;

  INSERT INTO dept_product_allocations (po_id, style_id, style_color_id, department, product_quantity)
  VALUES (p_po_id, p_style_id, p_style_color_id, p_department, p_add_quantity)
  ON CONFLICT (po_id, style_id, style_color_id, department) WHERE deleted_at IS NULL
  DO UPDATE SET
    product_quantity = dept_product_allocations.product_quantity + p_add_quantity,
    updated_at = NOW()
  RETURNING * INTO v_allocation;

  v_new_total := v_allocation.product_quantity;

  INSERT INTO dept_product_allocation_logs (allocation_id, added_quantity, total_after, created_by)
  VALUES (v_allocation.id, p_add_quantity, v_new_total, p_created_by);

  RETURN jsonb_build_object(
    'allocation_id', v_allocation.id,
    'department', v_allocation.department,
    'previous_quantity', v_new_total - p_add_quantity,
    'added_quantity', p_add_quantity,
    'new_total', v_new_total,
    'remaining_for_others', v_total_product_qty - (v_current_allocated + p_add_quantity)
  );
END;
$$;
