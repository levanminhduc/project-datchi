ALTER TABLE lots
ADD COLUMN created_by_employee_id INTEGER REFERENCES employees(id);
