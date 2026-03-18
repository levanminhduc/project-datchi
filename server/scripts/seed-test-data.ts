import dotenv from 'dotenv'
dotenv.config()

import { supabaseAdmin } from '../db/supabase'

/**
 * Script để seed dữ liệu test
 * Tạo: warehouses, suppliers, colors, thread_types, thread_inventory
 */
async function seedTestData() {
  console.log('🌱 Bắt đầu seed dữ liệu test...\n')
  
  try {
    // =============================================
    // 1. WAREHOUSES (Locations + Storages)
    // =============================================
    console.log('📦 Đang tạo warehouses...')
    
    // Insert LOCATIONS first
    const locations = [
      { code: 'DB', name: 'Kho Điện Bàn', location: 'Điện Bàn, Quảng Nam', type: 'LOCATION', parent_id: null, sort_order: 1, is_active: true },
      { code: 'PT', name: 'Kho Phú Tường', location: 'Phú Tường, Đà Nẵng', type: 'LOCATION', parent_id: null, sort_order: 2, is_active: true }
    ]
    
    for (const loc of locations) {
      const { error } = await supabaseAdmin
        .from('warehouses')
        .upsert(loc, { onConflict: 'code' })
      if (error) console.error(`  ❌ ${loc.code}:`, error.message)
      else console.log(`  ✓ ${loc.name}`)
    }
    
    // Get DB id for parent reference
    const { data: dbData } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('code', 'DB')
      .single()
    const dbId = dbData?.id
    
    const { data: ptData } = await supabaseAdmin
      .from('warehouses')
      .select('id')
      .eq('code', 'PT')
      .single()
    const ptId = ptData?.id
    
    // Insert STORAGES under Điện Bàn
    const storages = [
      { code: 'DB-DK', name: 'Kho Dệt Kim', location: 'Xưởng Dệt Kim, Điện Bàn', type: 'STORAGE', parent_id: dbId, sort_order: 1, is_active: true },
      { code: 'DB-XT', name: 'Kho Xưởng Trước', location: 'Xưởng Trước, Điện Bàn', type: 'STORAGE', parent_id: dbId, sort_order: 2, is_active: true },
      { code: 'DB-XN', name: 'Kho Xưởng Nhật', location: 'Xưởng Nhật, Điện Bàn', type: 'STORAGE', parent_id: dbId, sort_order: 3, is_active: true },
      { code: 'PT-01', name: 'Kho Phú Tường', location: 'Kho thuê, Phú Tường', type: 'STORAGE', parent_id: ptId, sort_order: 1, is_active: true }
    ]
    
    for (const storage of storages) {
      const { error } = await supabaseAdmin
        .from('warehouses')
        .upsert(storage, { onConflict: 'code' })
      if (error) console.error(`  ❌ ${storage.code}:`, error.message)
      else console.log(`  ✓ ${storage.name}`)
    }
    
    // =============================================
    // 2. SUPPLIERS (12 nhà cung cấp)
    // =============================================
    console.log('\n🏭 Đang tạo suppliers...')
    
    const suppliers = [
      { code: 'NCC-001', name: 'Công ty TNHH Chỉ May Việt Tiến', contact_name: 'Nguyễn Văn An', phone: '0903123456', email: 'sales@viettien.vn', address: 'Số 15, Đường Lê Lợi, Quận 1, TP.HCM', lead_time_days: 7, is_active: true },
      { code: 'NCC-002', name: 'Công ty CP Sợi Chỉ Phú Thọ', contact_name: 'Trần Thị Bích', phone: '0912345678', email: 'order@phutho-thread.com', address: 'KCN Phú Thọ, Phú Thọ', lead_time_days: 10, is_active: true },
      { code: 'NCC-003', name: 'Công ty TNHH Coats Việt Nam', contact_name: 'David Lee', phone: '0909888777', email: 'vietnam@coats.com', address: 'KCN Tân Bình, TP.HCM', lead_time_days: 5, is_active: true },
      { code: 'NCC-004', name: 'Nhà máy Chỉ Kim Ngọc', contact_name: 'Lê Thị Kim', phone: '0905555666', email: 'kimngoc@gmail.com', address: 'Đường 30/4, TP. Đà Nẵng', lead_time_days: 7, is_active: true },
      { code: 'NCC-005', name: 'Công ty TNHH American Thread', contact_name: 'John Smith', phone: '0908123456', email: 'sales@amthread.vn', address: 'KCN Long Bình, Biên Hòa', lead_time_days: 14, is_active: true },
      { code: 'NCC-006', name: 'Xưởng Chỉ Thái Bình', contact_name: 'Phạm Văn Hùng', phone: '0911222333', email: 'thaibinh.thread@yahoo.com', address: 'TP. Thái Bình', lead_time_days: 8, is_active: true },
      { code: 'NCC-007', name: 'Công ty CP Dệt May Hà Nội', contact_name: 'Hoàng Minh Tuấn', phone: '0904567890', email: 'sales@detmayhn.vn', address: 'KCN Sài Đồng, Hà Nội', lead_time_days: 12, is_active: true },
      { code: 'NCC-008', name: 'Công ty TNHH Onuki Việt Nam', contact_name: 'Tanaka Yuki', phone: '0907999888', email: 'vietnam@onuki.jp', address: 'KCN VSIP, Bình Dương', lead_time_days: 6, is_active: true },
      { code: 'NCC-009', name: 'Xí nghiệp Chỉ May Bình Định', contact_name: 'Võ Thanh Hải', phone: '0902333444', email: 'binhdinh.chi@gmail.com', address: 'TP. Quy Nhơn, Bình Định', lead_time_days: 9, is_active: true },
      { code: 'NCC-010', name: 'Công ty TNHH Gütermann Việt Nam', contact_name: 'Hans Mueller', phone: '0906777666', email: 'sales@gutermann.vn', address: 'KCN Nhơn Trạch, Đồng Nai', lead_time_days: 7, is_active: true },
      { code: 'NCC-011', name: 'Nhà máy Sợi Đồng Nai', contact_name: 'Nguyễn Thị Hoa', phone: '0913456789', email: 'dongnai.soi@outlook.com', address: 'KCN Biên Hòa 2, Đồng Nai', lead_time_days: 5, is_active: true },
      { code: 'NCC-012', name: 'Công ty TNHH A&E Gütermann', contact_name: 'Michael Chen', phone: '0901888999', email: 'michael@aegutermann.com', address: 'KCN Tân Thuận, Quận 7, TP.HCM', lead_time_days: 10, is_active: true }
    ]
    
    for (const sup of suppliers) {
      const { error } = await supabaseAdmin
        .from('suppliers')
        .upsert(sup, { onConflict: 'code' })
      if (error) console.error(`  ❌ ${sup.code}:`, error.message)
      else console.log(`  ✓ ${sup.name}`)
    }
    
    // =============================================
    // 3. COLORS (25 màu sắc)
    // =============================================
    console.log('\n🎨 Đang tạo colors...')
    
    const colors = [
      { name: 'Trắng', hex_code: '#FFFFFF', pantone_code: '11-0601 TCX', ral_code: 'RAL 9003', is_active: true },
      { name: 'Đen', hex_code: '#000000', pantone_code: '19-4005 TCX', ral_code: 'RAL 9005', is_active: true },
      { name: 'Đỏ', hex_code: '#DC2626', pantone_code: '18-1664 TCX', ral_code: 'RAL 3020', is_active: true },
      { name: 'Đỏ Đậm', hex_code: '#991B1B', pantone_code: '19-1557 TCX', ral_code: 'RAL 3003', is_active: true },
      { name: 'Xanh Dương', hex_code: '#2563EB', pantone_code: '18-4051 TCX', ral_code: 'RAL 5015', is_active: true },
      { name: 'Xanh Navy', hex_code: '#1E3A8A', pantone_code: '19-3939 TCX', ral_code: 'RAL 5013', is_active: true },
      { name: 'Xanh Lá', hex_code: '#16A34A', pantone_code: '17-6153 TCX', ral_code: 'RAL 6024', is_active: true },
      { name: 'Xanh Lá Đậm', hex_code: '#166534', pantone_code: '19-5420 TCX', ral_code: 'RAL 6016', is_active: true },
      { name: 'Vàng', hex_code: '#EAB308', pantone_code: '13-0859 TCX', ral_code: 'RAL 1018', is_active: true },
      { name: 'Vàng Nhạt', hex_code: '#FDE047', pantone_code: '12-0736 TCX', ral_code: 'RAL 1016', is_active: true },
      { name: 'Cam', hex_code: '#EA580C', pantone_code: '16-1364 TCX', ral_code: 'RAL 2004', is_active: true },
      { name: 'Hồng', hex_code: '#DB2777', pantone_code: '17-2034 TCX', ral_code: 'RAL 4003', is_active: true },
      { name: 'Hồng Nhạt', hex_code: '#F472B6', pantone_code: '15-2214 TCX', ral_code: 'RAL 3015', is_active: true },
      { name: 'Tím', hex_code: '#9333EA', pantone_code: '18-3838 TCX', ral_code: 'RAL 4005', is_active: true },
      { name: 'Tím Đậm', hex_code: '#6B21A8', pantone_code: '19-3640 TCX', ral_code: 'RAL 4007', is_active: true },
      { name: 'Nâu', hex_code: '#92400E', pantone_code: '18-1140 TCX', ral_code: 'RAL 8024', is_active: true },
      { name: 'Be', hex_code: '#D4B896', pantone_code: '14-1116 TCX', ral_code: 'RAL 1001', is_active: true },
      { name: 'Xám', hex_code: '#6B7280', pantone_code: '17-4402 TCX', ral_code: 'RAL 7037', is_active: true },
      { name: 'Xám Nhạt', hex_code: '#9CA3AF', pantone_code: '15-4306 TCX', ral_code: 'RAL 7035', is_active: true },
      { name: 'Xám Đậm', hex_code: '#374151', pantone_code: '19-4007 TCX', ral_code: 'RAL 7024', is_active: true },
      { name: 'Xanh Ngọc', hex_code: '#0D9488', pantone_code: '17-5024 TCX', ral_code: 'RAL 6033', is_active: true },
      { name: 'Xanh Cyan', hex_code: '#06B6D4', pantone_code: '15-4825 TCX', ral_code: 'RAL 5018', is_active: true },
      { name: 'Bạc', hex_code: '#C0C0C0', pantone_code: '14-4102 TCX', ral_code: 'RAL 9006', is_active: true },
      { name: 'Vàng Gold', hex_code: '#D4AF37', pantone_code: '16-0946 TCX', ral_code: 'RAL 1024', is_active: true },
      { name: 'Kem', hex_code: '#FFFDD0', pantone_code: '11-0107 TCX', ral_code: 'RAL 1015', is_active: true }
    ]
    
    for (const color of colors) {
      const { error } = await supabaseAdmin
        .from('colors')
        .upsert(color, { onConflict: 'name' })
      if (error) console.error(`  ❌ ${color.name}:`, error.message)
      else console.log(`  ✓ ${color.name}`)
    }
    
    // =============================================
    // 4. THREAD TYPES (50 loại chỉ)
    // =============================================
    console.log('\n🧵 Đang tạo thread types (50 loại)...')

    const { data: colorData } = await supabaseAdmin
      .from('colors')
      .select('id, name')
    const colorMap = new Map(colorData?.map(c => [c.name, c.id]) || [])

    const { data: supplierData } = await supabaseAdmin
      .from('suppliers')
      .select('id, name')
    const supplierMap = new Map(supplierData?.map(s => [s.name, s.id]) || [])

    const threadTypes = [
      { code: 'CHI-20-TRA', name: 'Chỉ Polyester Trắng TEX20', color_id: colorMap.get('Trắng'), material: 'POLYESTER', tex_number: 20.00, density_grams_per_meter: 0.020000, meters_per_cone: 6000.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 15000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-20-DEN', name: 'Chỉ Polyester Đen TEX20', color_id: colorMap.get('Đen'), material: 'POLYESTER', tex_number: 20.00, density_grams_per_meter: 0.020000, meters_per_cone: 6000.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 15000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-20-DO', name: 'Chỉ Polyester Đỏ TEX20', color_id: colorMap.get('Đỏ'), material: 'POLYESTER', tex_number: 20.00, density_grams_per_meter: 0.020000, meters_per_cone: 6000.00, supplier_id: supplierMap.get('Công ty TNHH Chỉ May Việt Tiến'), reorder_level_meters: 12000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-20-XDG', name: 'Chỉ Polyester Xanh Dương TEX20', color_id: colorMap.get('Xanh Dương'), material: 'POLYESTER', tex_number: 20.00, density_grams_per_meter: 0.020000, meters_per_cone: 6000.00, supplier_id: supplierMap.get('Công ty TNHH Chỉ May Việt Tiến'), reorder_level_meters: 12000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-20-VAG', name: 'Chỉ Polyester Vàng TEX20', color_id: colorMap.get('Vàng'), material: 'POLYESTER', tex_number: 20.00, density_grams_per_meter: 0.020000, meters_per_cone: 6000.00, supplier_id: supplierMap.get('Công ty TNHH Chỉ May Việt Tiến'), reorder_level_meters: 10000.00, lead_time_days: 7, is_active: true },

      { code: 'CHI-25-TRA', name: 'Chỉ Cotton Trắng TEX25', color_id: colorMap.get('Trắng'), material: 'COTTON', tex_number: 25.00, density_grams_per_meter: 0.025000, meters_per_cone: 5500.00, supplier_id: supplierMap.get('Công ty CP Sợi Chỉ Phú Thọ'), reorder_level_meters: 12000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-25-DEN', name: 'Chỉ Cotton Đen TEX25', color_id: colorMap.get('Đen'), material: 'COTTON', tex_number: 25.00, density_grams_per_meter: 0.025000, meters_per_cone: 5500.00, supplier_id: supplierMap.get('Công ty CP Sợi Chỉ Phú Thọ'), reorder_level_meters: 12000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-25-NAU', name: 'Chỉ Cotton Nâu TEX25', color_id: colorMap.get('Nâu'), material: 'COTTON', tex_number: 25.00, density_grams_per_meter: 0.025000, meters_per_cone: 5500.00, supplier_id: supplierMap.get('Công ty CP Sợi Chỉ Phú Thọ'), reorder_level_meters: 8000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-25-BEE', name: 'Chỉ Cotton Be TEX25', color_id: colorMap.get('Be'), material: 'COTTON', tex_number: 25.00, density_grams_per_meter: 0.025000, meters_per_cone: 5500.00, supplier_id: supplierMap.get('Xưởng Chỉ Thái Bình'), reorder_level_meters: 8000.00, lead_time_days: 8, is_active: true },
      { code: 'CHI-25-XAM', name: 'Chỉ Cotton Xám TEX25', color_id: colorMap.get('Xám'), material: 'COTTON', tex_number: 25.00, density_grams_per_meter: 0.025000, meters_per_cone: 5500.00, supplier_id: supplierMap.get('Xưởng Chỉ Thái Bình'), reorder_level_meters: 8000.00, lead_time_days: 8, is_active: true },

      { code: 'CHI-30-TRA', name: 'Chỉ Polyester Trắng TEX30', color_id: colorMap.get('Trắng'), material: 'POLYESTER', tex_number: 30.00, density_grams_per_meter: 0.030000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Gütermann Việt Nam'), reorder_level_meters: 15000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-30-DEN', name: 'Chỉ Polyester Đen TEX30', color_id: colorMap.get('Đen'), material: 'POLYESTER', tex_number: 30.00, density_grams_per_meter: 0.030000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Gütermann Việt Nam'), reorder_level_meters: 15000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-30-XLA', name: 'Chỉ Polyester Xanh Lá TEX30', color_id: colorMap.get('Xanh Lá'), material: 'POLYESTER', tex_number: 30.00, density_grams_per_meter: 0.030000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Nhà máy Chỉ Kim Ngọc'), reorder_level_meters: 10000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-30-HOG', name: 'Chỉ Polyester Hồng TEX30', color_id: colorMap.get('Hồng'), material: 'POLYESTER', tex_number: 30.00, density_grams_per_meter: 0.030000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Nhà máy Chỉ Kim Ngọc'), reorder_level_meters: 8000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-30-TIM', name: 'Chỉ Polyester Tím TEX30', color_id: colorMap.get('Tím'), material: 'POLYESTER', tex_number: 30.00, density_grams_per_meter: 0.030000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Nhà máy Chỉ Kim Ngọc'), reorder_level_meters: 8000.00, lead_time_days: 7, is_active: true },

      { code: 'CHI-35-TRA', name: 'Chỉ Nylon Trắng TEX35', color_id: colorMap.get('Trắng'), material: 'NYLON', tex_number: 35.00, density_grams_per_meter: 0.035000, meters_per_cone: 4800.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 12000.00, lead_time_days: 14, is_active: true },
      { code: 'CHI-35-DEN', name: 'Chỉ Nylon Đen TEX35', color_id: colorMap.get('Đen'), material: 'NYLON', tex_number: 35.00, density_grams_per_meter: 0.035000, meters_per_cone: 4800.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 12000.00, lead_time_days: 14, is_active: true },
      { code: 'CHI-35-NAV', name: 'Chỉ Nylon Navy TEX35', color_id: colorMap.get('Xanh Navy'), material: 'NYLON', tex_number: 35.00, density_grams_per_meter: 0.035000, meters_per_cone: 4800.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 10000.00, lead_time_days: 14, is_active: true },
      { code: 'CHI-35-XAD', name: 'Chỉ Nylon Xám Đậm TEX35', color_id: colorMap.get('Xám Đậm'), material: 'NYLON', tex_number: 35.00, density_grams_per_meter: 0.035000, meters_per_cone: 4800.00, supplier_id: supplierMap.get('Công ty TNHH Onuki Việt Nam'), reorder_level_meters: 8000.00, lead_time_days: 6, is_active: true },
      { code: 'CHI-35-CAM', name: 'Chỉ Nylon Cam TEX35', color_id: colorMap.get('Cam'), material: 'NYLON', tex_number: 35.00, density_grams_per_meter: 0.035000, meters_per_cone: 4800.00, supplier_id: supplierMap.get('Công ty TNHH Onuki Việt Nam'), reorder_level_meters: 6000.00, lead_time_days: 6, is_active: true },

      { code: 'CHI-40-TRA', name: 'Chỉ Polyester Trắng TEX40', color_id: colorMap.get('Trắng'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 20000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-40-DEN', name: 'Chỉ Polyester Đen TEX40', color_id: colorMap.get('Đen'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 20000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-40-DO', name: 'Chỉ Polyester Đỏ TEX40', color_id: colorMap.get('Đỏ'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Chỉ May Việt Tiến'), reorder_level_meters: 15000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-40-XDG', name: 'Chỉ Polyester Xanh Dương TEX40', color_id: colorMap.get('Xanh Dương'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty TNHH Chỉ May Việt Tiến'), reorder_level_meters: 15000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-40-XLA', name: 'Chỉ Polyester Xanh Lá TEX40', color_id: colorMap.get('Xanh Lá'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty CP Dệt May Hà Nội'), reorder_level_meters: 12000.00, lead_time_days: 12, is_active: true },
      { code: 'CHI-40-VAG', name: 'Chỉ Polyester Vàng TEX40', color_id: colorMap.get('Vàng'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Công ty CP Dệt May Hà Nội'), reorder_level_meters: 10000.00, lead_time_days: 12, is_active: true },
      { code: 'CHI-40-HOG', name: 'Chỉ Polyester Hồng TEX40', color_id: colorMap.get('Hồng'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Nhà máy Chỉ Kim Ngọc'), reorder_level_meters: 8000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-40-KEM', name: 'Chỉ Polyester Kem TEX40', color_id: colorMap.get('Kem'), material: 'POLYESTER', tex_number: 40.00, density_grams_per_meter: 0.040000, meters_per_cone: 5000.00, supplier_id: supplierMap.get('Nhà máy Chỉ Kim Ngọc'), reorder_level_meters: 8000.00, lead_time_days: 7, is_active: true },

      { code: 'CHI-45-TRA', name: 'Chỉ Silk Trắng TEX45', color_id: colorMap.get('Trắng'), material: 'SILK', tex_number: 45.00, density_grams_per_meter: 0.045000, meters_per_cone: 4500.00, supplier_id: supplierMap.get('Công ty TNHH Gütermann Việt Nam'), reorder_level_meters: 10000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-45-DEN', name: 'Chỉ Silk Đen TEX45', color_id: colorMap.get('Đen'), material: 'SILK', tex_number: 45.00, density_grams_per_meter: 0.045000, meters_per_cone: 4500.00, supplier_id: supplierMap.get('Công ty TNHH Gütermann Việt Nam'), reorder_level_meters: 10000.00, lead_time_days: 7, is_active: true },
      { code: 'CHI-45-GOD', name: 'Chỉ Silk Vàng Gold TEX45', color_id: colorMap.get('Vàng Gold'), material: 'SILK', tex_number: 45.00, density_grams_per_meter: 0.045000, meters_per_cone: 4500.00, supplier_id: supplierMap.get('Công ty TNHH A&E Gütermann'), reorder_level_meters: 6000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-45-BAC', name: 'Chỉ Silk Bạc TEX45', color_id: colorMap.get('Bạc'), material: 'SILK', tex_number: 45.00, density_grams_per_meter: 0.045000, meters_per_cone: 4500.00, supplier_id: supplierMap.get('Công ty TNHH A&E Gütermann'), reorder_level_meters: 6000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-45-TIM', name: 'Chỉ Silk Tím TEX45', color_id: colorMap.get('Tím'), material: 'SILK', tex_number: 45.00, density_grams_per_meter: 0.045000, meters_per_cone: 4500.00, supplier_id: supplierMap.get('Công ty TNHH A&E Gütermann'), reorder_level_meters: 5000.00, lead_time_days: 10, is_active: true },

      { code: 'CHI-50-TRA', name: 'Chỉ Mixed Trắng TEX50', color_id: colorMap.get('Trắng'), material: 'MIXED', tex_number: 50.00, density_grams_per_meter: 0.050000, meters_per_cone: 4000.00, supplier_id: supplierMap.get('Xí nghiệp Chỉ May Bình Định'), reorder_level_meters: 12000.00, lead_time_days: 9, is_active: true },
      { code: 'CHI-50-DEN', name: 'Chỉ Mixed Đen TEX50', color_id: colorMap.get('Đen'), material: 'MIXED', tex_number: 50.00, density_grams_per_meter: 0.050000, meters_per_cone: 4000.00, supplier_id: supplierMap.get('Xí nghiệp Chỉ May Bình Định'), reorder_level_meters: 12000.00, lead_time_days: 9, is_active: true },
      { code: 'CHI-50-XNG', name: 'Chỉ Mixed Xanh Ngọc TEX50', color_id: colorMap.get('Xanh Ngọc'), material: 'MIXED', tex_number: 50.00, density_grams_per_meter: 0.050000, meters_per_cone: 4000.00, supplier_id: supplierMap.get('Xí nghiệp Chỉ May Bình Định'), reorder_level_meters: 8000.00, lead_time_days: 9, is_active: true },
      { code: 'CHI-50-CYA', name: 'Chỉ Mixed Xanh Cyan TEX50', color_id: colorMap.get('Xanh Cyan'), material: 'MIXED', tex_number: 50.00, density_grams_per_meter: 0.050000, meters_per_cone: 4000.00, supplier_id: supplierMap.get('Nhà máy Sợi Đồng Nai'), reorder_level_meters: 8000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-50-XAN', name: 'Chỉ Mixed Xám Nhạt TEX50', color_id: colorMap.get('Xám Nhạt'), material: 'MIXED', tex_number: 50.00, density_grams_per_meter: 0.050000, meters_per_cone: 4000.00, supplier_id: supplierMap.get('Nhà máy Sợi Đồng Nai'), reorder_level_meters: 8000.00, lead_time_days: 5, is_active: true },

      { code: 'CHI-60-TRA', name: 'Chỉ Polyester Trắng TEX60', color_id: colorMap.get('Trắng'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 12000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-60-DEN', name: 'Chỉ Polyester Đen TEX60', color_id: colorMap.get('Đen'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Công ty TNHH Coats Việt Nam'), reorder_level_meters: 12000.00, lead_time_days: 5, is_active: true },
      { code: 'CHI-60-XDG', name: 'Chỉ Polyester Xanh Dương TEX60', color_id: colorMap.get('Xanh Dương'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Công ty CP Sợi Chỉ Phú Thọ'), reorder_level_meters: 10000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-60-NAV', name: 'Chỉ Polyester Navy TEX60', color_id: colorMap.get('Xanh Navy'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Công ty CP Sợi Chỉ Phú Thọ'), reorder_level_meters: 10000.00, lead_time_days: 10, is_active: true },
      { code: 'CHI-60-DOD', name: 'Chỉ Polyester Đỏ Đậm TEX60', color_id: colorMap.get('Đỏ Đậm'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Xưởng Chỉ Thái Bình'), reorder_level_meters: 8000.00, lead_time_days: 8, is_active: true },
      { code: 'CHI-60-XLD', name: 'Chỉ Polyester Xanh Lá Đậm TEX60', color_id: colorMap.get('Xanh Lá Đậm'), material: 'POLYESTER', tex_number: 60.00, density_grams_per_meter: 0.060000, meters_per_cone: 3500.00, supplier_id: supplierMap.get('Xưởng Chỉ Thái Bình'), reorder_level_meters: 8000.00, lead_time_days: 8, is_active: true },

      { code: 'CHI-70-TRA', name: 'Chỉ Rayon Trắng TEX70', color_id: colorMap.get('Trắng'), material: 'RAYON', tex_number: 70.00, density_grams_per_meter: 0.070000, meters_per_cone: 3000.00, supplier_id: supplierMap.get('Công ty TNHH Onuki Việt Nam'), reorder_level_meters: 8000.00, lead_time_days: 6, is_active: true },
      { code: 'CHI-70-DEN', name: 'Chỉ Rayon Đen TEX70', color_id: colorMap.get('Đen'), material: 'RAYON', tex_number: 70.00, density_grams_per_meter: 0.070000, meters_per_cone: 3000.00, supplier_id: supplierMap.get('Công ty TNHH Onuki Việt Nam'), reorder_level_meters: 8000.00, lead_time_days: 6, is_active: true },
      { code: 'CHI-70-TDD', name: 'Chỉ Rayon Tím Đậm TEX70', color_id: colorMap.get('Tím Đậm'), material: 'RAYON', tex_number: 70.00, density_grams_per_meter: 0.070000, meters_per_cone: 3000.00, supplier_id: supplierMap.get('Công ty TNHH Onuki Việt Nam'), reorder_level_meters: 5000.00, lead_time_days: 6, is_active: true },

      { code: 'CHI-80-TRA', name: 'Chỉ Nylon Trắng TEX80', color_id: colorMap.get('Trắng'), material: 'NYLON', tex_number: 80.00, density_grams_per_meter: 0.080000, meters_per_cone: 2500.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 6000.00, lead_time_days: 14, is_active: true },
      { code: 'CHI-80-DEN', name: 'Chỉ Nylon Đen TEX80', color_id: colorMap.get('Đen'), material: 'NYLON', tex_number: 80.00, density_grams_per_meter: 0.080000, meters_per_cone: 2500.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 6000.00, lead_time_days: 14, is_active: true },
      { code: 'CHI-80-HON', name: 'Chỉ Nylon Hồng Nhạt TEX80', color_id: colorMap.get('Hồng Nhạt'), material: 'NYLON', tex_number: 80.00, density_grams_per_meter: 0.080000, meters_per_cone: 2500.00, supplier_id: supplierMap.get('Công ty TNHH American Thread'), reorder_level_meters: 4000.00, lead_time_days: 14, is_active: true }
    ]
    
    let ttCount = 0
    for (const tt of threadTypes) {
      const { error } = await supabaseAdmin
        .from('thread_types')
        .upsert(tt, { onConflict: 'code' })
      if (error) console.error(`  ❌ ${tt.code}:`, error.message)
      else ttCount++
    }
    console.log(`  ✓ Đã tạo ${ttCount} loại chỉ`)
    
    // =============================================
    // 5. THREAD INVENTORY
    // =============================================
    console.log('\n📦 Đang tạo thread inventory...')
    
    // Get all thread types and warehouses for reference
    const { data: ttData } = await supabaseAdmin
      .from('thread_types')
      .select('id, code, meters_per_cone, density_grams_per_meter')
      .like('code', 'CHI-%')
    
    const { data: whData } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .in('code', ['DB-DK', 'DB-XN', 'DB-XT', 'PT-01'])
    
    if (!ttData || !whData) {
      console.error('  ❌ Không thể lấy dữ liệu thread types hoặc warehouses')
      return
    }
    
    // Delete old test inventory
    await supabaseAdmin
      .from('thread_inventory')
      .delete()
      .like('cone_id', 'TST-%')
    
    const warehouses = new Map(whData.map(w => [w.code, w]))
    
    // Helper function
    const createConeData = (
      coneId: string,
      threadType: typeof ttData[0],
      warehouseId: number,
      status: string,
      lotNumber: string,
      receivedDate: string,
      location: string,
      isPartial = false,
      partialRatio = 1.0,
      expiryDate: string | null = null
    ) => {
      const meters = threadType.meters_per_cone * partialRatio
      const weight = meters * threadType.density_grams_per_meter
      return {
        cone_id: coneId,
        thread_type_id: threadType.id,
        warehouse_id: warehouseId,
        quantity_cones: 1,
        quantity_meters: Math.round(meters * 100) / 100,
        weight_grams: Math.round(weight * 100) / 100,
        is_partial: isPartial,
        status,
        lot_number: lotNumber,
        expiry_date: expiryDate,
        received_date: receivedDate,
        location
      }
    }
    
    const inventoryData: ReturnType<typeof createConeData>[] = []
    let coneCounter = 1
    
    // Kho Dệt Kim (DB-DK) - 50 cuộn
    const whDbDk = warehouses.get('DB-DK')!
    for (let i = 0; i < 50; i++) {
      const tt = ttData[i % ttData.length]
      const expiry = i % 3 === 0 ? '2026-12-31' : null
      inventoryData.push(createConeData(
        `TST-DK-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        whDbDk.id,
        'AVAILABLE',
        `LOT-2025-${String((i % 20) + 1).padStart(3, '0')}`,
        '2025-01-15',
        `A${Math.floor(i / 10) + 1}-${String((i % 10) + 1).padStart(2, '0')}`,
        false,
        1.0,
        expiry
      ))
    }
    console.log(`  ✓ Kho Dệt Kim: 50 cuộn`)
    
    // Kho Xưởng Nhật (DB-XN) - 50 cuộn
    const whDbXn = warehouses.get('DB-XN')!
    for (let i = 0; i < 50; i++) {
      const tt = ttData[(i + 10) % ttData.length]
      const expiry = i % 4 === 0 ? '2027-06-30' : null
      inventoryData.push(createConeData(
        `TST-XN-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        whDbXn.id,
        'AVAILABLE',
        `LOT-2025-${String((i % 20) + 21).padStart(3, '0')}`,
        '2025-01-20',
        `B${Math.floor(i / 10) + 1}-${String((i % 10) + 1).padStart(2, '0')}`,
        false,
        1.0,
        expiry
      ))
    }
    console.log(`  ✓ Kho Xưởng Nhật: 50 cuộn`)
    
    // Kho Xưởng Trước (DB-XT) - 40 cuộn
    const whDbXt = warehouses.get('DB-XT')!
    for (let i = 0; i < 40; i++) {
      const tt = ttData[(i + 20) % ttData.length]
      const expiry = i % 5 === 0 ? '2026-09-30' : null
      inventoryData.push(createConeData(
        `TST-XT-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        whDbXt.id,
        'AVAILABLE',
        `LOT-2025-${String((i % 15) + 41).padStart(3, '0')}`,
        '2025-01-25',
        `C${Math.floor(i / 8) + 1}-${String((i % 8) + 1).padStart(2, '0')}`,
        false,
        1.0,
        expiry
      ))
    }
    console.log(`  ✓ Kho Xưởng Trước: 40 cuộn`)
    
    // Kho Phú Tường (PT-01) - 40 cuộn
    const whPt01 = warehouses.get('PT-01')!
    for (let i = 0; i < 40; i++) {
      const tt = ttData[(i + 30) % ttData.length]
      const expiry = i % 4 === 0 ? '2027-03-31' : null
      inventoryData.push(createConeData(
        `TST-PT-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        whPt01.id,
        'AVAILABLE',
        `LOT-2025-${String((i % 12) + 56).padStart(3, '0')}`,
        '2025-02-01',
        `P${Math.floor(i / 8) + 1}-${String((i % 8) + 1).padStart(2, '0')}`,
        false,
        1.0,
        expiry
      ))
    }
    console.log(`  ✓ Kho Phú Tường: 40 cuộn`)
    
    // Cuộn lẻ (partial cones) - 20 cuộn
    const warehouseIds = [whDbDk.id, whDbXn.id, whDbXt.id, whPt01.id]
    for (let i = 0; i < 20; i++) {
      const tt = ttData[(i + 40) % ttData.length]
      const partialRatio = 0.2 + Math.random() * 0.5 // 20-70% remaining
      inventoryData.push(createConeData(
        `TST-PAR-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        warehouseIds[i % 4],
        'AVAILABLE',
        `LOT-2024-PAR-${String(i + 1).padStart(3, '0')}`,
        '2024-12-15',
        `REC-${String(i + 1).padStart(2, '0')}`,
        true,
        partialRatio
      ))
    }
    console.log(`  ✓ Cuộn lẻ: 20 cuộn`)
    
    // Cuộn đang sản xuất (IN_PRODUCTION) - 10 cuộn
    for (let i = 0; i < 10; i++) {
      const tt = ttData.find(t => t.code.includes('40')) || ttData[i]
      inventoryData.push(createConeData(
        `TST-PRO-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        [whDbDk.id, whDbXn.id][i % 2],
        'IN_PRODUCTION',
        `LOT-2025-PRO-${String(i + 1).padStart(3, '0')}`,
        '2025-01-10',
        ''
      ))
    }
    console.log(`  ✓ Đang sản xuất: 10 cuộn`)
    
    // Cuộn mới nhận (RECEIVED) - 10 cuộn
    for (let i = 0; i < 10; i++) {
      const tt = ttData.find(t => t.code.includes('60')) || ttData[i + 10]
      inventoryData.push(createConeData(
        `TST-NEW-${String(coneCounter++).padStart(3, '0')}`,
        tt,
        whDbDk.id,
        'RECEIVED',
        `LOT-2025-NEW-${String(i + 1).padStart(3, '0')}`,
        new Date().toISOString().split('T')[0],
        'RECV-AREA'
      ))
    }
    console.log(`  ✓ Mới nhận: 10 cuộn`)
    
    // Insert all inventory in batches
    const batchSize = 50
    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = inventoryData.slice(i, i + batchSize)
      const { error } = await supabaseAdmin
        .from('thread_inventory')
        .upsert(batch, { onConflict: 'cone_id' })
      if (error) {
        console.error(`  ❌ Batch ${i}-${i + batch.length}:`, error.message)
      }
    }
    
    console.log(`\n✅ HOÀN TẤT! Tổng cộng ${inventoryData.length} cuộn chỉ đã được tạo.`)
    
    // =============================================
    // VERIFICATION
    // =============================================
    console.log('\n📊 THỐNG KÊ:')
    
    const { count: whCount } = await supabaseAdmin.from('warehouses').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: supCount } = await supabaseAdmin.from('suppliers').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: colCount } = await supabaseAdmin.from('colors').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: ttCount2 } = await supabaseAdmin.from('thread_types').select('*', { count: 'exact', head: true }).eq('is_active', true).like('code', 'CHI-%')
    const { count: invCount } = await supabaseAdmin.from('thread_inventory').select('*', { count: 'exact', head: true }).like('cone_id', 'TST-%')
    
    console.log(`  • Warehouses: ${whCount}`)
    console.log(`  • Suppliers: ${supCount}`)
    console.log(`  • Colors: ${colCount}`)
    console.log(`  • Thread Types: ${ttCount2}`)
    console.log(`  • Inventory: ${invCount}`)
    
  } catch (err) {
    console.error('❌ Lỗi:', err)
    throw err
  }
}

seedTestData()
  .then(() => {
    console.log('\n🎉 Seed dữ liệu test hoàn tất!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Seed thất bại:', err)
    process.exit(1)
  })
