BEGIN;

CREATE OR REPLACE FUNCTION fn_stock_to_inventory()
RETURNS TABLE (migrated_count INTEGER, skipped_count INTEGER) AS $$
DECLARE
  v_stock RECORD;
  v_lot_id INTEGER;
  v_lot_number VARCHAR(50);
  v_meters_per_cone NUMERIC;
  v_partial_ratio NUMERIC;
  v_seq INTEGER;
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_existing_count INTEGER;
  v_supplier_id INTEGER;
BEGIN
  v_partial_ratio := fn_get_partial_cone_ratio();

  FOR v_stock IN SELECT ts.*, tt.meters_per_cone, tt.supplier_id AS tt_supplier_id
                 FROM thread_stock ts
                 JOIN thread_types tt ON ts.thread_type_id = tt.id
  LOOP
    SELECT COUNT(*) INTO v_existing_count
    FROM thread_inventory
    WHERE cone_id LIKE 'MIG-' || v_stock.id || '-%';

    IF v_existing_count > 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF (v_stock.qty_full_cones + v_stock.qty_partial_cones) = 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_lot_number := COALESCE(v_stock.lot_number, 'MIG-LOT-' || v_stock.id);
    v_supplier_id := v_stock.tt_supplier_id;
    v_meters_per_cone := COALESCE(v_stock.meters_per_cone, 0);

    BEGIN
      INSERT INTO lots (lot_number, thread_type_id, warehouse_id, supplier_id, expiry_date, total_cones, available_cones, status, notes, created_at)
      VALUES (
        v_lot_number,
        v_stock.thread_type_id,
        v_stock.warehouse_id,
        v_supplier_id,
        v_stock.expiry_date,
        v_stock.qty_full_cones + v_stock.qty_partial_cones,
        v_stock.qty_full_cones + v_stock.qty_partial_cones,
        'ACTIVE',
        v_stock.notes,
        COALESCE(v_stock.created_at, NOW())
      )
      RETURNING id INTO v_lot_id;
    EXCEPTION WHEN unique_violation THEN
      v_lot_number := v_lot_number || '-' || v_stock.id;
      INSERT INTO lots (lot_number, thread_type_id, warehouse_id, supplier_id, expiry_date, total_cones, available_cones, status, notes, created_at)
      VALUES (
        v_lot_number,
        v_stock.thread_type_id,
        v_stock.warehouse_id,
        v_supplier_id,
        v_stock.expiry_date,
        v_stock.qty_full_cones + v_stock.qty_partial_cones,
        v_stock.qty_full_cones + v_stock.qty_partial_cones,
        'ACTIVE',
        v_stock.notes,
        COALESCE(v_stock.created_at, NOW())
      )
      RETURNING id INTO v_lot_id;
    END;

    v_seq := 0;
    FOR i IN 1..v_stock.qty_full_cones LOOP
      v_seq := v_seq + 1;
      INSERT INTO thread_inventory (cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters, is_partial, status, lot_number, lot_id, received_date, expiry_date, created_at)
      VALUES (
        'MIG-' || v_stock.id || '-' || LPAD(v_seq::TEXT, 4, '0'),
        v_stock.thread_type_id,
        v_stock.warehouse_id,
        1,
        v_meters_per_cone,
        false,
        'AVAILABLE',
        v_lot_number,
        v_lot_id,
        COALESCE(v_stock.received_date, CURRENT_DATE),
        v_stock.expiry_date,
        COALESCE(v_stock.created_at, NOW())
      );
    END LOOP;

    FOR i IN 1..v_stock.qty_partial_cones LOOP
      v_seq := v_seq + 1;
      INSERT INTO thread_inventory (cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters, is_partial, status, lot_number, lot_id, received_date, expiry_date, created_at)
      VALUES (
        'MIG-' || v_stock.id || '-' || LPAD(v_seq::TEXT, 4, '0'),
        v_stock.thread_type_id,
        v_stock.warehouse_id,
        1,
        v_meters_per_cone * v_partial_ratio,
        true,
        'AVAILABLE',
        v_lot_number,
        v_lot_id,
        COALESCE(v_stock.received_date, CURRENT_DATE),
        v_stock.expiry_date,
        COALESCE(v_stock.created_at, NOW())
      );
    END LOOP;

    v_migrated := v_migrated + v_stock.qty_full_cones + v_stock.qty_partial_cones;
  END LOOP;

  RETURN QUERY SELECT v_migrated, v_skipped;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM fn_stock_to_inventory();

DO $$
DECLARE
  v_mismatch RECORD;
  v_stock_total_full BIGINT;
  v_stock_total_partial BIGINT;
  v_inv_total_full BIGINT;
  v_inv_total_partial BIGINT;
BEGIN
  FOR v_mismatch IN
    SELECT
      ts.thread_type_id,
      ts.warehouse_id,
      SUM(ts.qty_full_cones) AS stock_full,
      SUM(ts.qty_partial_cones) AS stock_partial,
      COALESCE(inv.inv_full, 0) AS inv_full,
      COALESCE(inv.inv_partial, 0) AS inv_partial
    FROM thread_stock ts
    LEFT JOIN (
      SELECT thread_type_id, warehouse_id,
        COUNT(*) FILTER (WHERE NOT is_partial) AS inv_full,
        COUNT(*) FILTER (WHERE is_partial) AS inv_partial
      FROM thread_inventory
      WHERE cone_id LIKE 'MIG-%'
      GROUP BY thread_type_id, warehouse_id
    ) inv ON ts.thread_type_id = inv.thread_type_id AND ts.warehouse_id = inv.warehouse_id
    GROUP BY ts.thread_type_id, ts.warehouse_id, inv.inv_full, inv.inv_partial
    HAVING SUM(ts.qty_full_cones) != COALESCE(inv.inv_full, 0)
       OR SUM(ts.qty_partial_cones) != COALESCE(inv.inv_partial, 0)
  LOOP
    RAISE EXCEPTION 'Migration mismatch for thread_type_id=%, warehouse_id=%: stock(full=%, partial=%) vs inventory(full=%, partial=%)',
      v_mismatch.thread_type_id, v_mismatch.warehouse_id,
      v_mismatch.stock_full, v_mismatch.stock_partial,
      v_mismatch.inv_full, v_mismatch.inv_partial;
  END LOOP;

  SELECT COALESCE(SUM(qty_full_cones), 0), COALESCE(SUM(qty_partial_cones), 0)
  INTO v_stock_total_full, v_stock_total_partial
  FROM thread_stock;

  SELECT
    COUNT(*) FILTER (WHERE NOT is_partial),
    COUNT(*) FILTER (WHERE is_partial)
  INTO v_inv_total_full, v_inv_total_partial
  FROM thread_inventory
  WHERE cone_id LIKE 'MIG-%';

  IF v_stock_total_full != v_inv_total_full OR v_stock_total_partial != v_inv_total_partial THEN
    RAISE EXCEPTION 'Global migration mismatch: stock(full=%, partial=%) vs inventory(full=%, partial=%)',
      v_stock_total_full, v_stock_total_partial,
      v_inv_total_full, v_inv_total_partial;
  END IF;

  RAISE NOTICE 'Migration verification passed: % full cones, % partial cones', v_stock_total_full, v_stock_total_partial;
END $$;

DROP VIEW IF EXISTS v_stock_summary;

CREATE VIEW v_stock_summary AS
SELECT
  ti.thread_type_id,
  tt.code AS thread_code,
  tt.name AS thread_name,
  c.name AS thread_color,
  ti.warehouse_id,
  w.code AS warehouse_code,
  w.name AS warehouse_name,
  COUNT(*) FILTER (WHERE NOT ti.is_partial) AS total_full_cones,
  COUNT(*) FILTER (WHERE ti.is_partial) AS total_partial_cones,
  COUNT(*) FILTER (WHERE NOT ti.is_partial)::NUMERIC
    + COUNT(*) FILTER (WHERE ti.is_partial)::NUMERIC
    * COALESCE(fn_get_partial_cone_ratio(), 0.3) AS total_equivalent_cones
FROM thread_inventory ti
JOIN thread_types tt ON ti.thread_type_id = tt.id
JOIN colors c ON tt.color_id = c.id
JOIN warehouses w ON ti.warehouse_id = w.id
WHERE ti.status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED', 'SOFT_ALLOCATED', 'HARD_ALLOCATED')
GROUP BY ti.thread_type_id, tt.code, tt.name, c.name, ti.warehouse_id, w.code, w.name;

NOTIFY pgrst, 'reload schema';

COMMIT;
