CREATE OR REPLACE FUNCTION public.fn_manual_return_loan(p_loan_id integer, p_quantity integer, p_returned_by character varying, p_notes text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_loan RECORD;
  v_cone RECORD;
  v_moved INTEGER := 0;
  v_remaining_debt INTEGER;
  v_available_count INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Số cuộn phải lớn hơn 0';
  END IF;

  SELECT tol.id, tol.from_week_id, tol.to_week_id, tol.thread_type_id,
         tol.quantity_cones, tol.returned_cones, tol.status
  INTO v_loan
  FROM thread_order_loans tol
  WHERE tol.id = p_loan_id
    AND tol.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy khoản mượn';
  END IF;

  IF v_loan.from_week_id IS NULL THEN
    RAISE EXCEPTION 'Khoản mượn từ tồn kho không hỗ trợ trả thủ công';
  END IF;

  IF v_loan.status = 'SETTLED' THEN
    RAISE EXCEPTION 'Khoản mượn đã được thanh toán đầy đủ';
  END IF;

  v_remaining_debt := v_loan.quantity_cones - v_loan.returned_cones;

  IF p_quantity > v_remaining_debt THEN
    RAISE EXCEPTION 'Chỉ có thể trả tối đa % cuộn', v_remaining_debt;
  END IF;

  SELECT COUNT(*) INTO v_available_count
  FROM thread_inventory
  WHERE status = 'RESERVED_FOR_ORDER'
    AND reserved_week_id = v_loan.to_week_id
    AND thread_type_id = v_loan.thread_type_id;

  IF v_available_count < p_quantity THEN
    RAISE EXCEPTION 'Không đủ cuộn khả dụng trong kho tuần mượn (có %, cần %)', v_available_count, p_quantity;
  END IF;

  FOR v_cone IN
    SELECT id
    FROM thread_inventory
    WHERE status = 'RESERVED_FOR_ORDER'
      AND reserved_week_id = v_loan.to_week_id
      AND thread_type_id = v_loan.thread_type_id
    ORDER BY received_date ASC, id ASC
    LIMIT p_quantity
    FOR UPDATE
  LOOP
    UPDATE thread_inventory
    SET reserved_week_id = v_loan.from_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id
      AND status = 'RESERVED_FOR_ORDER'
      AND reserved_week_id = v_loan.to_week_id;

    IF FOUND THEN
      v_moved := v_moved + 1;
    END IF;
  END LOOP;

  UPDATE thread_order_loans
  SET returned_cones = returned_cones + v_moved,
      status = CASE WHEN (returned_cones + v_moved) >= quantity_cones THEN 'SETTLED' ELSE status END,
      updated_at = NOW()
  WHERE id = p_loan_id;

  INSERT INTO thread_loan_return_logs (loan_id, cones_returned, return_type, returned_by, notes)
  VALUES (p_loan_id, v_moved, 'MANUAL', p_returned_by, p_notes);

  RETURN json_build_object(
    'success', true,
    'returned', v_moved,
    'remaining', v_remaining_debt - v_moved,
    'settled', (v_loan.returned_cones + v_moved) >= v_loan.quantity_cones
  );
END;
$function$;
