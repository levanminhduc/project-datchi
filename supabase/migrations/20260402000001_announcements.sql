-- Announcements table
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_announcements_active
  ON announcements(is_active, deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_announcements_sort
  ON announcements(priority DESC, created_at DESC);

-- Dismissals tracking table
CREATE TABLE announcement_dismissals (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, employee_id)
);

CREATE INDEX idx_announcement_dismissals_employee
  ON announcement_dismissals(employee_id);
