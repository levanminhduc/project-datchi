CREATE TABLE thread_issue_return_logs (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES thread_issues(id) ON DELETE CASCADE,
    line_id INTEGER NOT NULL REFERENCES thread_issue_lines(id) ON DELETE CASCADE,
    returned_full INTEGER NOT NULL DEFAULT 0,
    returned_partial INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_return_log_full_positive CHECK (returned_full >= 0),
    CONSTRAINT chk_return_log_partial_positive CHECK (returned_partial >= 0)
);

CREATE INDEX idx_return_logs_issue_id ON thread_issue_return_logs(issue_id);
