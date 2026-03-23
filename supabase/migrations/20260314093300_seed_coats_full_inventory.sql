BEGIN;

ALTER TABLE thread_inventory DISABLE TRIGGER trigger_sync_lot_on_inventory_change;
ALTER TABLE thread_inventory DISABLE TRIGGER audit_thread_inventory;
ALTER TABLE thread_types DISABLE TRIGGER audit_thread_types;
ALTER TABLE lots DISABLE TRIGGER trigger_lots_updated_at;

DELETE FROM thread_inventory WHERE thread_type_id IN (
  SELECT id FROM thread_types WHERE supplier_id IN (26,27,28,29)
);

DELETE FROM lots WHERE thread_type_id IN (
  SELECT id FROM thread_types WHERE supplier_id IN (26,27,28,29)
);

DELETE FROM thread_type_supplier WHERE thread_type_id IN (
  SELECT id FROM thread_types WHERE supplier_id IN (26,27,28,29)
);

DELETE FROM thread_types WHERE supplier_id IN (26,27,28,29);

DO $$
DECLARE
  v_supplier RECORD;
  v_tex RECORD;
  v_color RECORD;
  v_tt_id INT;
  v_lot_id INT;
  v_lot_seq INT := 300;
  v_cone_seq INT := 5000;
  v_cone_count INT;
  v_meters NUMERIC(12,2);
  v_density NUMERIC(10,6);
  v_prod_date DATE;
  v_warehouse_id INT;
  v_warehouse_ids INT[] := ARRAY[32,33,34];
  v_wh_idx INT := 0;
  v_ncc_short TEXT;
  v_tt_count INT := 0;
  v_lot_count INT := 0;
  v_cone_total INT := 0;
  v_cs_id INT;
BEGIN
  FOR v_supplier IN
    SELECT * FROM (VALUES
      (26, 'Astra',  'ASTRA',  ARRAY[27,40,60,80]),
      (27, 'Epic',   'EPIC',   ARRAY[30,40,60,80]),
      (28, 'Gramax', 'GRAMAX', ARRAY[21,24,35,70]),
      (29, 'Cometa', 'COMETA', ARRAY[27,40,60,80])
    ) AS t(sid, sname, scode, texes)
  LOOP
    v_ncc_short := v_supplier.scode;

    FOR v_tex IN SELECT unnest(v_supplier.texes) AS tex_val
    LOOP
      v_meters := CASE v_tex.tex_val
        WHEN 21 THEN 5000
        WHEN 24 THEN 5000
        WHEN 27 THEN 5000
        WHEN 30 THEN 4000
        WHEN 35 THEN 5000
        WHEN 40 THEN 3000
        WHEN 60 THEN 2500
        WHEN 70 THEN 2500
        WHEN 80 THEN 2000
      END;

      v_density := v_tex.tex_val::NUMERIC / 1000.0;

      FOR v_color IN
        SELECT cs.id AS cs_id, cs.color_id, c.name AS color_name
        FROM color_supplier cs
        JOIN colors c ON c.id = cs.color_id
        WHERE cs.supplier_id = v_supplier.sid
        ORDER BY c.name
      LOOP
        INSERT INTO thread_types (
          code, name, material, tex_number, density_grams_per_meter,
          meters_per_cone, reorder_level_meters, lead_time_days, is_active,
          color_id, supplier_id, color_supplier_id,
          tex_label
        ) VALUES (
          'CHI-' || v_tex.tex_val || '-' || v_color.color_name || '-' || v_ncc_short,
          'Coats ' || v_supplier.sname || ' TEX' || v_tex.tex_val || ' ' || v_color.color_name,
          'POLYESTER',
          v_tex.tex_val,
          v_density,
          v_meters,
          v_meters * 5,
          7,
          TRUE,
          v_color.color_id,
          v_supplier.sid,
          v_color.cs_id,
          'TEX' || v_tex.tex_val
        )
        RETURNING id INTO v_tt_id;

        v_tt_count := v_tt_count + 1;

        INSERT INTO thread_type_supplier (
          thread_type_id, supplier_id, supplier_item_code, is_active, meters_per_cone
        ) VALUES (
          v_tt_id, v_supplier.sid,
          v_ncc_short || '-' || v_tex.tex_val || '-' || v_color.color_name,
          TRUE, v_meters
        );

        v_lot_seq := v_lot_seq + 1;
        v_wh_idx := v_wh_idx + 1;
        IF v_wh_idx > 3 THEN v_wh_idx := 1; END IF;
        v_warehouse_id := v_warehouse_ids[v_wh_idx];

        v_cone_count := 5 + floor(random() * 6)::INT;

        v_prod_date := '2026-01-01'::DATE + (floor(random() * 59))::INT;

        INSERT INTO lots (
          lot_number, thread_type_id, warehouse_id, supplier_id,
          production_date, expiry_date, total_cones, available_cones, status
        ) VALUES (
          'LOT-COATS-' || v_lot_seq,
          v_tt_id, v_warehouse_id, v_supplier.sid,
          v_prod_date, v_prod_date + INTERVAL '1 year',
          v_cone_count, v_cone_count, 'ACTIVE'
        )
        RETURNING id INTO v_lot_id;

        v_lot_count := v_lot_count + 1;

        FOR i IN 1..v_cone_count LOOP
          v_cone_seq := v_cone_seq + 1;

          INSERT INTO thread_inventory (
            cone_id, thread_type_id, warehouse_id, quantity_cones,
            quantity_meters, weight_grams, is_partial, status,
            lot_number, expiry_date, received_date, lot_id
          ) VALUES (
            'CONE-' || v_ncc_short || '-' || v_cone_seq,
            v_tt_id, v_warehouse_id, 1,
            v_meters,
            v_meters * v_density,
            FALSE, 'AVAILABLE',
            'LOT-COATS-' || v_lot_seq,
            v_prod_date + INTERVAL '1 year',
            v_prod_date + 3,
            v_lot_id
          );

          v_cone_total := v_cone_total + 1;
        END LOOP;

      END LOOP;
    END LOOP;

    RAISE NOTICE 'NCC % xong: % thread_types', v_supplier.sname, v_tt_count;
  END LOOP;

  RAISE NOTICE 'Tổng: % thread_types, % lots, % cones', v_tt_count, v_lot_count, v_cone_total;
END $$;

ALTER TABLE thread_inventory ENABLE TRIGGER trigger_sync_lot_on_inventory_change;
ALTER TABLE thread_inventory ENABLE TRIGGER audit_thread_inventory;
ALTER TABLE thread_types ENABLE TRIGGER audit_thread_types;
ALTER TABLE lots ENABLE TRIGGER trigger_lots_updated_at;

NOTIFY pgrst, 'reload schema';

COMMIT;
