CREATE OR REPLACE FUNCTION fn_increment_style_thread_spec_order(p_style_id int)
RETURNS void AS $$
  UPDATE style_thread_specs
  SET display_order = display_order + 1
  WHERE style_id = p_style_id;
$$ LANGUAGE sql;
