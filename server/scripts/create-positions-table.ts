import dotenv from 'dotenv'
dotenv.config()

import { query } from '../db/query'

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

  try {
    await query(createTableSQL, [])
  } catch (createError) {
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
    try {
      await query(
        'INSERT INTO positions (name, display_name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [pos.name, pos.display_name]
      )
      console.log(`✓ Inserted: ${pos.display_name}`)
    } catch (error) {
      console.error(`Error inserting ${pos.name}:`, (error as Error).message)
    }
  }

  console.log('Done!')
}

createPositionsTable().catch(console.error)
