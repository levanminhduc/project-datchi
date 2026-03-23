BEGIN;

ALTER TABLE thread_issues
  ADD COLUMN IF NOT EXISTS source_warehouse_id INTEGER REFERENCES warehouses(id);

CREATE INDEX IF NOT EXISTS idx_thread_issues_warehouse
  ON thread_issues(source_warehouse_id);

COMMENT ON COLUMN thread_issues.source_warehouse_id
  IS 'Kho nguon xuat chi - auto-detect tu RESERVED cones hoac FREE pool';

COMMIT;
