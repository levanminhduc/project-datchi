-- Thread Order Deliveries - Track delivery dates per weekly order
-- Dependencies: thread_order_weeks, thread_types, suppliers, update_updated_at_column()

CREATE TABLE thread_order_deliveries (
    id SERIAL PRIMARY KEY,
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(week_id, thread_type_id)
);

COMMENT ON TABLE thread_order_deliveries IS 'Theo dõi ngày giao hàng của NCC cho từng tuần đặt chỉ';
COMMENT ON COLUMN thread_order_deliveries.delivery_date IS 'Ngày giao dự kiến (tính từ lead_time_days của NCC)';
COMMENT ON COLUMN thread_order_deliveries.actual_delivery_date IS 'Ngày giao thực tế';
COMMENT ON COLUMN thread_order_deliveries.status IS 'Trạng thái: pending, delivered';

CREATE INDEX idx_thread_order_deliveries_week_id ON thread_order_deliveries(week_id);
CREATE INDEX idx_thread_order_deliveries_status ON thread_order_deliveries(status);
CREATE INDEX idx_thread_order_deliveries_delivery_date ON thread_order_deliveries(delivery_date);

CREATE TRIGGER trigger_thread_order_deliveries_updated_at
    BEFORE UPDATE ON thread_order_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
