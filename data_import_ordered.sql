-- =====================================================
-- IMPORT DATA - Theo thứ tự FK dependencies
-- =====================================================

-- Tắt FK checks tạm thời
SET session_replication_role = 'replica';

-- Xóa data cũ (uncomment nếu cần)
-- TRUNCATE colors, suppliers, thread_types, warehouses, employees, roles, permissions, thread_inventory, thread_allocations, thread_type_supplier CASCADE;


-- Thread Types (55 records)
INSERT INTO public.thread_types VALUES (51, 'T-RED-40', 'Chi Do 40', 'Do', '#DC2626', 'polyester', 40.00, 0.040000, 5000.00, 'Cong ty Chi May ABC', 10000.00, 7, true, '2026-02-05 09:23:16.156781+00', '2026-02-05 09:23:16.156781+00', NULL, NULL, NULL);
INSERT INTO public.thread_types VALUES (52, 'T-BLUE-60', 'Chi Xanh Duong 60', 'Xanh Duong', '#2563EB', 'polyester', 60.00, 0.060000, 3500.00, 'Cong ty Chi May ABC', 8000.00, 7, true, '2026-02-05 09:23:16.156781+00', '2026-02-05 09:23:16.156781+00', NULL, NULL, NULL);
INSERT INTO public.thread_types VALUES (53, 'T-WHITE-30', 'Chi Trang 30', 'Trang', '#FFFFFF', 'cotton', 30.00, 0.030000, 6000.00, 'Nha may Chi XYZ', 15000.00, 10, true, '2026-02-05 09:23:16.156781+00', '2026-02-05 09:23:16.156781+00', NULL, NULL, NULL);
INSERT INTO public.thread_types VALUES (54, 'T-BLACK-50', 'Chi Den 50', 'Den', '#171717', 'nylon', 50.00, 0.050000, 4000.00, 'Nha may Chi XYZ', 12000.00, 10, true, '2026-02-05 09:23:16.156781+00', '2026-02-05 09:23:16.156781+00', NULL, NULL, NULL);
INSERT INTO public.thread_types VALUES (55, 'T-YELLOW-45', 'Chi Vang 45', 'Vang', '#EAB308', 'silk', 45.00, 0.045000, 4500.00, 'Cong ty To Lua VN', 5000.00, 14, true, '2026-02-05 09:23:16.156781+00', '2026-02-05 09:23:16.156781+00', NULL, NULL, NULL);
INSERT INTO public.thread_types VALUES (24, 'CHI-40-XDG', 'Chỉ Polyester Xanh Dương TEX40', 'Xanh Dương', '#2563EB', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Chỉ May Việt Tiến', 15000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 1, NULL);
INSERT INTO public.thread_types VALUES (23, 'CHI-40-DO', 'Chỉ Polyester Đỏ TEX40', 'Đỏ', '#DC2626', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Chỉ May Việt Tiến', 15000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 1, NULL);
INSERT INTO public.thread_types VALUES (5, 'CHI-20-VAG', 'Chỉ Polyester Vàng TEX20', 'Vàng', '#EAB308', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 10000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 1, NULL);
INSERT INTO public.thread_types VALUES (4, 'CHI-20-XDG', 'Chỉ Polyester Xanh Dương TEX20', 'Xanh Dương', '#2563EB', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 12000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 1, NULL);
INSERT INTO public.thread_types VALUES (3, 'CHI-20-DO', 'Chỉ Polyester Đỏ TEX20', 'Đỏ', '#DC2626', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 12000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 1, NULL);
INSERT INTO public.thread_types VALUES (42, 'CHI-60-NAV', 'Chỉ Polyester Navy TEX60', 'Xanh Navy', '#1E3A8A', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 10000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 2, NULL);
INSERT INTO public.thread_types VALUES (41, 'CHI-60-XDG', 'Chỉ Polyester Xanh Dương TEX60', 'Xanh Dương', '#2563EB', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 10000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 2, NULL);
INSERT INTO public.thread_types VALUES (8, 'CHI-25-NAU', 'Chỉ Cotton Nâu TEX25', 'Nâu', '#92400E', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 8000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 2, NULL);
INSERT INTO public.thread_types VALUES (7, 'CHI-25-DEN', 'Chỉ Cotton Đen TEX25', 'Đen', '#000000', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 12000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 2, NULL);
INSERT INTO public.thread_types VALUES (6, 'CHI-25-TRA', 'Chỉ Cotton Trắng TEX25', 'Trắng', '#FFFFFF', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 12000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 2, NULL);
INSERT INTO public.thread_types VALUES (40, 'CHI-60-DEN', 'Chỉ Polyester Đen TEX60', 'Đen', '#000000', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty TNHH Coats Việt Nam', 12000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (39, 'CHI-60-TRA', 'Chỉ Polyester Trắng TEX60', 'Trắng', '#FFFFFF', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty TNHH Coats Việt Nam', 12000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (22, 'CHI-40-DEN', 'Chỉ Polyester Đen TEX40', 'Đen', '#000000', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Coats Việt Nam', 20000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (21, 'CHI-40-TRA', 'Chỉ Polyester Trắng TEX40', 'Trắng', '#FFFFFF', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Coats Việt Nam', 20000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (2, 'CHI-20-DEN', 'Chỉ Polyester Đen TEX20', 'Đen', '#000000', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Coats Việt Nam', 15000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (1, 'CHI-20-TRA', 'Chỉ Polyester Trắng TEX20', 'Trắng', '#FFFFFF', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Coats Việt Nam', 15000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 3, NULL);
INSERT INTO public.thread_types VALUES (28, 'CHI-40-KEM', 'Chỉ Polyester Kem TEX40', 'Kem', '#FFFDD0', 'polyester', 40.00, 0.040000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 4, NULL);
INSERT INTO public.thread_types VALUES (27, 'CHI-40-HOG', 'Chỉ Polyester Hồng TEX40', 'Hồng', '#DB2777', 'polyester', 40.00, 0.040000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 4, NULL);
INSERT INTO public.thread_types VALUES (15, 'CHI-30-TIM', 'Chỉ Polyester Tím TEX30', 'Tím', '#9333EA', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 4, NULL);
INSERT INTO public.thread_types VALUES (14, 'CHI-30-HOG', 'Chỉ Polyester Hồng TEX30', 'Hồng', '#DB2777', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 4, NULL);
INSERT INTO public.thread_types VALUES (13, 'CHI-30-XLA', 'Chỉ Polyester Xanh Lá TEX30', 'Xanh Lá', '#16A34A', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 10000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 4, NULL);
INSERT INTO public.thread_types VALUES (50, 'CHI-80-HON', 'Chỉ Nylon Hồng Nhạt TEX80', 'Hồng Nhạt', '#F472B6', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 4000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (49, 'CHI-80-DEN', 'Chỉ Nylon Đen TEX80', 'Đen', '#000000', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 6000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (48, 'CHI-80-TRA', 'Chỉ Nylon Trắng TEX80', 'Trắng', '#FFFFFF', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 6000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (18, 'CHI-35-NAV', 'Chỉ Nylon Navy TEX35', 'Xanh Navy', '#1E3A8A', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 10000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (17, 'CHI-35-DEN', 'Chỉ Nylon Đen TEX35', 'Đen', '#000000', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 12000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (16, 'CHI-35-TRA', 'Chỉ Nylon Trắng TEX35', 'Trắng', '#FFFFFF', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 12000.00, 14, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 5, NULL);
INSERT INTO public.thread_types VALUES (44, 'CHI-60-XLD', 'Chỉ Polyester Xanh Lá Đậm TEX60', 'Xanh Lá Đậm', '#166534', 'polyester', 60.00, 0.060000, 3500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 6, NULL);
INSERT INTO public.thread_types VALUES (43, 'CHI-60-DOD', 'Chỉ Polyester Đỏ Đậm TEX60', 'Đỏ Đậm', '#991B1B', 'polyester', 60.00, 0.060000, 3500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 6, NULL);
INSERT INTO public.thread_types VALUES (10, 'CHI-25-XAM', 'Chỉ Cotton Xám TEX25', 'Xám', '#6B7280', 'cotton', 25.00, 0.025000, 5500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 6, NULL);
INSERT INTO public.thread_types VALUES (9, 'CHI-25-BEE', 'Chỉ Cotton Be TEX25', 'Be', '#D4B896', 'cotton', 25.00, 0.025000, 5500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 6, NULL);
INSERT INTO public.thread_types VALUES (26, 'CHI-40-VAG', 'Chỉ Polyester Vàng TEX40', 'Vàng', '#EAB308', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty CP Dệt May Hà Nội', 10000.00, 12, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 7, NULL);
INSERT INTO public.thread_types VALUES (25, 'CHI-40-XLA', 'Chỉ Polyester Xanh Lá TEX40', 'Xanh Lá', '#16A34A', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty CP Dệt May Hà Nội', 12000.00, 12, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 7, NULL);
INSERT INTO public.thread_types VALUES (47, 'CHI-70-TDD', 'Chỉ Rayon Tím Đậm TEX70', 'Tím Đậm', '#6B21A8', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 5000.00, 6, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 8, NULL);
INSERT INTO public.thread_types VALUES (46, 'CHI-70-DEN', 'Chỉ Rayon Đen TEX70', 'Đen', '#000000', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 8, NULL);
INSERT INTO public.thread_types VALUES (45, 'CHI-70-TRA', 'Chỉ Rayon Trắng TEX70', 'Trắng', '#FFFFFF', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 8, NULL);
INSERT INTO public.thread_types VALUES (20, 'CHI-35-CAM', 'Chỉ Nylon Cam TEX35', 'Cam', '#EA580C', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH Onuki Việt Nam', 6000.00, 6, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 8, NULL);
INSERT INTO public.thread_types VALUES (19, 'CHI-35-XAD', 'Chỉ Nylon Xám Đậm TEX35', 'Xám Đậm', '#374151', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 8, NULL);
INSERT INTO public.thread_types VALUES (36, 'CHI-50-XNG', 'Chỉ Mixed Xanh Ngọc TEX50', 'Xanh Ngọc', '#0D9488', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 8000.00, 9, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 9, NULL);
INSERT INTO public.thread_types VALUES (35, 'CHI-50-DEN', 'Chỉ Mixed Đen TEX50', 'Đen', '#000000', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 12000.00, 9, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 9, NULL);
INSERT INTO public.thread_types VALUES (34, 'CHI-50-TRA', 'Chỉ Mixed Trắng TEX50', 'Trắng', '#FFFFFF', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 12000.00, 9, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 9, NULL);
INSERT INTO public.thread_types VALUES (30, 'CHI-45-DEN', 'Chỉ Silk Đen TEX45', 'Đen', '#000000', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH Gütermann Việt Nam', 10000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 10, NULL);
INSERT INTO public.thread_types VALUES (29, 'CHI-45-TRA', 'Chỉ Silk Trắng TEX45', 'Trắng', '#FFFFFF', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH Gütermann Việt Nam', 10000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 10, NULL);
INSERT INTO public.thread_types VALUES (12, 'CHI-30-DEN', 'Chỉ Polyester Đen TEX30', 'Đen', '#000000', 'polyester', 30.00, 0.030000, 5000.00, 'Công ty TNHH Gütermann Việt Nam', 15000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 10, NULL);
INSERT INTO public.thread_types VALUES (11, 'CHI-30-TRA', 'Chỉ Polyester Trắng TEX30', 'Trắng', '#FFFFFF', 'polyester', 30.00, 0.030000, 5000.00, 'Công ty TNHH Gütermann Việt Nam', 15000.00, 7, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 10, NULL);
INSERT INTO public.thread_types VALUES (38, 'CHI-50-XAN', 'Chỉ Mixed Xám Nhạt TEX50', 'Xám Nhạt', '#9CA3AF', 'mixed', 50.00, 0.050000, 4000.00, 'Nhà máy Sợi Đồng Nai', 8000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 11, NULL);
INSERT INTO public.thread_types VALUES (37, 'CHI-50-CYA', 'Chỉ Mixed Xanh Cyan TEX50', 'Xanh Cyan', '#06B6D4', 'mixed', 50.00, 0.050000, 4000.00, 'Nhà máy Sợi Đồng Nai', 8000.00, 5, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 11, NULL);
INSERT INTO public.thread_types VALUES (33, 'CHI-45-TIM', 'Chỉ Silk Tím TEX45', 'Tím', '#9333EA', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 5000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 12, NULL);
INSERT INTO public.thread_types VALUES (32, 'CHI-45-BAC', 'Chỉ Silk Bạc TEX45', 'Bạc', '#C0C0C0', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 6000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 12, NULL);
INSERT INTO public.thread_types VALUES (31, 'CHI-45-GOD', 'Chỉ Silk Vàng Gold TEX45', 'Vàng Gold', '#D4AF37', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 6000.00, 10, true, '2026-02-05 09:22:59.055267+00', '2026-02-05 09:29:52.946455+00', NULL, 12, NULL);

-- Thread Type Supplier (51 records)
INSERT INTO public.thread_type_supplier VALUES (1, 24, 1, 'SP-CHI-40-XDG', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (2, 23, 1, 'SP-CHI-40-DO', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (3, 5, 1, 'SP-CHI-20-VAG', 45000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (4, 4, 1, 'SP-CHI-20-XDG', 45000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (5, 3, 1, 'SP-CHI-20-DO', 45000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (6, 42, 2, 'SP-CHI-60-NAV', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (7, 41, 2, 'SP-CHI-60-XDG', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (8, 8, 2, 'SP-CHI-25-NAU', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (9, 7, 2, 'SP-CHI-25-DEN', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (10, 6, 2, 'SP-CHI-25-TRA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (11, 40, 3, 'SP-CHI-60-DEN', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (12, 39, 3, 'SP-CHI-60-TRA', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (13, 22, 3, 'SP-CHI-40-DEN', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (14, 21, 3, 'SP-CHI-40-TRA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (15, 2, 3, 'SP-CHI-20-DEN', 45000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (16, 1, 3, 'SP-CHI-20-TRA', 45000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (17, 28, 4, 'SP-CHI-40-KEM', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (18, 27, 4, 'SP-CHI-40-HOG', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (19, 15, 4, 'SP-CHI-30-TIM', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (20, 14, 4, 'SP-CHI-30-HOG', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (21, 13, 4, 'SP-CHI-30-XLA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (22, 50, 5, 'SP-CHI-80-HON', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (23, 49, 5, 'SP-CHI-80-DEN', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (24, 48, 5, 'SP-CHI-80-TRA', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (25, 18, 5, 'SP-CHI-35-NAV', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (26, 17, 5, 'SP-CHI-35-DEN', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (27, 16, 5, 'SP-CHI-35-TRA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (28, 44, 6, 'SP-CHI-60-XLD', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (29, 43, 6, 'SP-CHI-60-DOD', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (30, 10, 6, 'SP-CHI-25-XAM', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (31, 9, 6, 'SP-CHI-25-BEE', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (32, 26, 7, 'SP-CHI-40-VAG', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (33, 25, 7, 'SP-CHI-40-XLA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (34, 47, 8, 'SP-CHI-70-TDD', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (35, 46, 8, 'SP-CHI-70-DEN', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (36, 45, 8, 'SP-CHI-70-TRA', 75000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (37, 20, 8, 'SP-CHI-35-CAM', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (38, 19, 8, 'SP-CHI-35-XAD', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (39, 36, 9, 'SP-CHI-50-XNG', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (40, 35, 9, 'SP-CHI-50-DEN', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (41, 34, 9, 'SP-CHI-50-TRA', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (42, 30, 10, 'SP-CHI-45-DEN', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (43, 29, 10, 'SP-CHI-45-TRA', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (44, 12, 10, 'SP-CHI-30-DEN', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (45, 11, 10, 'SP-CHI-30-TRA', 55000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (46, 38, 11, 'SP-CHI-50-XAN', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (47, 37, 11, 'SP-CHI-50-CYA', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (48, 33, 12, 'SP-CHI-45-TIM', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (49, 32, 12, 'SP-CHI-45-BAC', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (50, 31, 12, 'SP-CHI-45-GOD', 65000.0000, true, 'Nhà cung cấp mặc định', '2026-02-05 09:32:45.311524+00', '2026-02-05 09:32:45.311524+00');
INSERT INTO public.thread_type_supplier VALUES (51, 51, 8, 'ONUKI-TEX40', 10000.0000, true, NULL, '2026-02-05 09:48:15.131503+00', '2026-02-05 09:48:15.131503+00');

-- Bật lại FK checks
SET session_replication_role = 'origin';

-- Reset sequences
SELECT setval('thread_types_id_seq', (SELECT MAX(id) FROM thread_types));
SELECT setval('thread_type_supplier_id_seq', (SELECT MAX(id) FROM thread_type_supplier));
