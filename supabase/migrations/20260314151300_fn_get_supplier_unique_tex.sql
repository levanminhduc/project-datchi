CREATE OR REPLACE FUNCTION fn_get_supplier_unique_tex(p_supplier_id INT)
RETURNS TABLE(
  id INT,
  code VARCHAR,
  name VARCHAR,
  tex_label TEXT,
  tex_number NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT DISTINCT ON (t.tex_number)
    t.id, t.code, t.name, t.tex_label, t.tex_number
  FROM thread_types t
  WHERE t.supplier_id = p_supplier_id
    AND t.deleted_at IS NULL
    AND t.is_active = TRUE
  ORDER BY t.tex_number ASC, t.id ASC;
$$;
