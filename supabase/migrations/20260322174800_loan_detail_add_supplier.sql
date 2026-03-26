BEGIN;

CREATE OR REPLACE FUNCTION fn_loan_detail_by_thread_type(p_week_id INTEGER)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_data ORDER BY row_data.thread_code), '[]'::json)
    FROM (
      SELECT
        tt.id AS thread_type_id,
        tt.code AS thread_code,
        tt.name AS thread_name,
        COALESCE(c.name, '') AS color_name,
        COALESCE(s.name, '') AS supplier_name,
        tt.tex_number,
        COALESCE(lb.borrowed_cones, 0) AS borrowed_cones,
        COALESCE(lr.borrowed_returned_cones, 0) AS borrowed_returned_cones,
        COALESCE(ll.lent_cones, 0) AS lent_cones,
        COALESCE(lo.lent_returned_cones, 0) AS lent_returned_cones,
        COALESCE(tod.ncc_ordered, 0) AS ncc_ordered,
        COALESCE(tod.ncc_received, 0) AS ncc_received,
        GREATEST(0, COALESCE(tod.ncc_ordered, 0) - COALESCE(tod.ncc_received, 0)) AS ncc_pending
      FROM thread_order_deliveries d
      JOIN thread_types tt ON tt.id = d.thread_type_id
      LEFT JOIN colors c ON c.id = tt.color_id
      LEFT JOIN suppliers s ON s.id = tt.supplier_id
      LEFT JOIN LATERAL (
        SELECT SUM(tol.quantity_cones) AS borrowed_cones
        FROM thread_order_loans tol
        WHERE tol.to_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.from_week_id IS NOT NULL
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) lb ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.returned_cones) AS borrowed_returned_cones
        FROM thread_order_loans tol
        WHERE tol.to_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.deleted_at IS NULL
      ) lr ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.quantity_cones) AS lent_cones
        FROM thread_order_loans tol
        WHERE tol.from_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) ll ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.returned_cones) AS lent_returned_cones
        FROM thread_order_loans tol
        WHERE tol.from_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.deleted_at IS NULL
      ) lo ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(tod2.quantity_cones) AS ncc_ordered,
          SUM(tod2.received_quantity) AS ncc_received
        FROM thread_order_deliveries tod2
        WHERE tod2.week_id = p_week_id
          AND tod2.thread_type_id = tt.id
      ) tod ON true
      WHERE d.week_id = p_week_id
      GROUP BY tt.id, tt.code, tt.name, c.name, s.name, tt.tex_number,
               lb.borrowed_cones, lr.borrowed_returned_cones,
               ll.lent_cones, lo.lent_returned_cones,
               tod.ncc_ordered, tod.ncc_received
    ) row_data
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_loan_detail_by_thread_type IS 'Per-thread-type loan breakdown for a week: borrowed, lent, NCC delivery status, returned_cones aggregates. Includes supplier_name and tex_number.';

NOTIFY pgrst, 'reload schema';

COMMIT;
