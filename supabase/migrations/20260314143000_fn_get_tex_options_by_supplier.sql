CREATE OR REPLACE FUNCTION fn_get_tex_options_by_supplier(p_supplier_id INTEGER)
RETURNS TABLE(id INTEGER, tex_number NUMERIC, tex_label VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (tt.tex_number)
    tt.id, tt.tex_number, tt.tex_label
  FROM thread_types tt
  WHERE tt.supplier_id = p_supplier_id
    AND tt.is_active = true
    AND tt.deleted_at IS NULL
    AND tt.tex_number IS NOT NULL
  UNION
  SELECT DISTINCT ON (tt2.tex_number)
    tt2.id, tt2.tex_number, tt2.tex_label
  FROM thread_type_supplier tts
  JOIN thread_types tt2 ON tt2.id = tts.thread_type_id
  WHERE tts.supplier_id = p_supplier_id
    AND tts.is_active = true
    AND tt2.is_active = true
    AND tt2.deleted_at IS NULL
    AND tt2.tex_number IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;
