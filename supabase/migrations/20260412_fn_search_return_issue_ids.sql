CREATE OR REPLACE FUNCTION fn_search_return_issue_ids(p_keyword TEXT)
RETURNS INTEGER[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT til.issue_id
    FROM thread_issue_lines til
    LEFT JOIN purchase_orders po ON po.id = til.po_id
    LEFT JOIN styles s ON s.id = til.style_id
    LEFT JOIN sub_arts sa ON sa.id = til.sub_art_id
    LEFT JOIN style_colors sc ON sc.id = til.style_color_id
    LEFT JOIN colors c ON c.id = til.color_id
    WHERE
      po.po_number ILIKE '%' || p_keyword || '%'
      OR s.style_code ILIKE '%' || p_keyword || '%'
      OR sa.sub_art_code ILIKE '%' || p_keyword || '%'
      OR sc.color_name ILIKE '%' || p_keyword || '%'
      OR c.name ILIKE '%' || p_keyword || '%'
  );
END;
$$ LANGUAGE plpgsql STABLE;
