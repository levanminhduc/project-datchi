BEGIN;

CREATE OR REPLACE FUNCTION fn_loan_dashboard_summary()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_data ORDER BY row_data.week_name), '[]'::json)
    FROM (
      SELECT
        w.id AS week_id,
        w.week_name,
        w.status AS week_status,
        COALESCE(d.total_needed, 0) AS total_needed,
        COALESCE(inv.reserved_count, 0) AS total_reserved,
        GREATEST(0, COALESCE(d.total_needed, 0) - COALESCE(inv.reserved_count, 0)) AS shortage,
        COALESCE(d.total_ordered, 0) AS ncc_ordered,
        COALESCE(d.total_received, 0) AS ncc_received,
        COALESCE(d.total_ordered, 0) - COALESCE(d.total_received, 0) AS ncc_pending,
        COALESCE(lb.borrowed_cones, 0) AS borrowed_cones,
        COALESCE(lb.borrowed_count, 0) AS borrowed_count,
        COALESCE(lb.borrowed_returned_cones, 0) AS borrowed_returned_cones,
        COALESCE(ll.lent_cones, 0) AS lent_cones,
        COALESCE(ll.lent_count, 0) AS lent_count,
        COALESCE(ll.lent_returned_cones, 0) AS lent_returned_cones
      FROM thread_order_weeks w
      LEFT JOIN LATERAL (
        SELECT
          SUM(tod.quantity_cones) AS total_needed,
          SUM(tod.quantity_cones) AS total_ordered,
          SUM(tod.received_quantity) AS total_received
        FROM thread_order_deliveries tod
        WHERE tod.week_id = w.id
      ) d ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS reserved_count
        FROM thread_inventory ti
        WHERE ti.reserved_week_id = w.id
          AND ti.status = 'RESERVED_FOR_ORDER'
      ) inv ON true
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(tol.quantity_cones), 0) AS borrowed_cones,
          COUNT(*) FILTER (WHERE tol.id IS NOT NULL) AS borrowed_count,
          COALESCE(SUM(tol.returned_cones), 0) AS borrowed_returned_cones
        FROM thread_order_loans tol
        WHERE tol.to_week_id = w.id
          AND tol.from_week_id IS NOT NULL
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) lb ON true
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(tol.quantity_cones), 0) AS lent_cones,
          COUNT(*) FILTER (WHERE tol.id IS NOT NULL) AS lent_count,
          COALESCE(SUM(tol.returned_cones), 0) AS lent_returned_cones
        FROM thread_order_loans tol
        WHERE tol.from_week_id = w.id
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) ll ON true
      WHERE w.status = 'CONFIRMED'
    ) row_data
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_loan_dashboard_summary IS 'Dashboard summary: per-week cones needed, reserved, shortage, NCC delivery status, active loans with return progress';

NOTIFY pgrst, 'reload schema';

COMMIT;
