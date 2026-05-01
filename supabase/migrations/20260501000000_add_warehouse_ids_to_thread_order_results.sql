ALTER TABLE thread_order_results ADD COLUMN warehouse_ids INTEGER[] DEFAULT NULL;

COMMENT ON COLUMN thread_order_results.warehouse_ids IS 'Snapshot kho đã chọn lúc lưu kết quả tính toán. NULL = tuần cũ chưa snapshot. {} = chọn rỗng = áp dụng tất cả kho khi reserve. {3,5} = đã chọn kho 3 và 5.';

NOTIFY pgrst, 'reload schema';
