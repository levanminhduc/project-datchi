import dotenv from 'dotenv'
dotenv.config()

import { supabaseAdmin as supabase } from '../db/supabase'

async function createPositionsTable() {
  console.log('Creating positions table...')
  
  // Create table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: createTableSQL
  })
  
  if (createError) {
    console.error('Error creating table:', createError)
    // Try alternative approach - insert data directly
    console.log('Trying to insert data directly...')
  }
  
  // Insert initial data
  const initialPositions = [
    { name: 'quan_ly', display_name: 'Quản Lý' },
    { name: 'nhan_vien', display_name: 'Nhân Viên' },
    { name: 'truong_phong', display_name: 'Trưởng Phòng' },
    { name: 'nhan_vien_ky_thuat', display_name: 'Nhân Viên Kỹ Thuật' },
    { name: 'giam_doc', display_name: 'Giám Đốc' },
    { name: 'pho_giam_doc', display_name: 'Phó Giám Đốc' },
  ]
  
  for (const pos of initialPositions) {
    const { error } = await supabase
      .from('positions')
      .upsert(pos, {
        onConflict: 'name',
        ignoreDuplicates: true
      })
    
    if (error) {
      console.error(`Error inserting ${pos.name}:`, error.message)
    } else {
      console.log(`✓ Inserted: ${pos.display_name}`)
    }
  }
  
  console.log('Done!')
}

createPositionsTable().catch(console.error)
