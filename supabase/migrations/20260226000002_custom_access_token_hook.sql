CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  emp_record RECORD;
  role_codes text[];
  is_root_val boolean;
BEGIN
  claims := event -> 'claims';

  SELECT e.id, e.employee_id, e.is_active
  INTO emp_record
  FROM public.employees e
  WHERE e.auth_user_id = (event ->> 'user_id')::uuid;

  IF NOT FOUND THEN
    RETURN event;
  END IF;

  IF NOT emp_record.is_active THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Tài khoản đã bị vô hiệu hóa'
      )
    );
  END IF;

  SELECT array_agg(r.code)
  INTO role_codes
  FROM public.employee_roles er
  JOIN public.roles r ON r.id = er.role_id
  WHERE er.employee_id = emp_record.id
    AND r.is_active = true;

  role_codes := COALESCE(role_codes, ARRAY[]::text[]);
  is_root_val := 'root' = ANY(role_codes);

  claims := jsonb_set(claims, '{employee_id}', to_jsonb(emp_record.id));
  claims := jsonb_set(claims, '{employee_code}', to_jsonb(emp_record.employee_id));
  claims := jsonb_set(claims, '{roles}', to_jsonb(role_codes));
  claims := jsonb_set(claims, '{is_root}', to_jsonb(is_root_val));

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;
