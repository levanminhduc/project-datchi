CREATE TABLE notification_channels (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id),
  channel_type TEXT NOT NULL,
  channel_config JSONB NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_channels_employee ON notification_channels(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_channels_active ON notification_channels(channel_type, is_active) WHERE deleted_at IS NULL;

CREATE TABLE notification_channel_groups (
  id SERIAL PRIMARY KEY,
  channel_type TEXT NOT NULL,
  channel_config JSONB NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_channel_groups_active ON notification_channel_groups(channel_type, is_active) WHERE deleted_at IS NULL;
