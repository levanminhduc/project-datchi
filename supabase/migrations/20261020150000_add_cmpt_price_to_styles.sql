ALTER TABLE styles
  ADD COLUMN IF NOT EXISTS cm_price NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS p_price  NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS t_price  NUMERIC(12,4);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_styles_cmpt_non_negative' AND conrelid = 'styles'::regclass
  ) THEN
    ALTER TABLE styles ADD CONSTRAINT chk_styles_cmpt_non_negative
      CHECK (cm_price >= 0 AND p_price >= 0 AND t_price >= 0);
  END IF;
END $$;

COMMENT ON COLUMN styles.cm_price IS 'Gia CM (Cut-Make), USD/cai';
COMMENT ON COLUMN styles.p_price  IS 'Gia P (Pack), USD/cai';
COMMENT ON COLUMN styles.t_price  IS 'Gia T (Trim), USD/cai';
