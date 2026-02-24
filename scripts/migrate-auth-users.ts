import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình trong .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface EmployeeRow {
  id: number
  employee_id: string
  password_hash: string
  full_name: string
  auth_user_id: string | null
}

async function migrateAuthUsers() {
  console.log('=== BẮT ĐẦU MIGRATE EMPLOYEES SANG SUPABASE AUTH ===\n')
  console.log(`Supabase URL: ${supabaseUrl}`)

  const { data: employees, error: fetchError } = await supabase
    .from('employees')
    .select('id, employee_id, password_hash, full_name, auth_user_id')
    .eq('is_active', true)
    .not('password_hash', 'is', null)
    .is('auth_user_id', null)

  if (fetchError) {
    console.error(`Lỗi khi đọc danh sách nhân viên: ${fetchError.message}`)
    process.exit(1)
  }

  if (!employees || employees.length === 0) {
    console.log('Không có nhân viên nào cần migrate. Tất cả đã có auth_user_id.')
    return
  }

  console.log(`Tìm thấy ${employees.length} nhân viên cần migrate.\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  const errors: { employee_id: string; error: string }[] = []

  for (const emp of employees as EmployeeRow[]) {
    const email = `${emp.employee_id.toLowerCase()}@internal.datchi.local`

    console.log(`[${emp.employee_id}] ${emp.full_name} → ${email}`)

    if (emp.auth_user_id) {
      console.log(`  ⏭ Đã có auth_user_id, bỏ qua.`)
      skipCount++
      continue
    }

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password_hash: emp.password_hash,
      email_confirm: true,
      user_metadata: {
        employee_id: emp.id,
        employee_code: emp.employee_id,
        full_name: emp.full_name,
      },
    } as any)

    if (createError) {
      if (createError.message?.includes('already been registered')) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const users = (existingUsers as any)?.users as { id: string; email?: string }[] | undefined
        const existingUser = users?.find((u) => u.email === email)

        if (existingUser) {
          const { error: updateError } = await supabase
            .from('employees')
            .update({ auth_user_id: existingUser.id })
            .eq('id', emp.id)

          if (updateError) {
            console.log(`  ✗ Email đã tồn tại, lỗi khi cập nhật auth_user_id: ${updateError.message}`)
            errorCount++
            errors.push({ employee_id: emp.employee_id, error: updateError.message })
          } else {
            console.log(`  ✓ Email đã tồn tại, đã liên kết auth_user_id: ${existingUser.id}`)
            successCount++
          }
        } else {
          console.log(`  ✗ Email đã đăng ký nhưng không tìm thấy user: ${createError.message}`)
          errorCount++
          errors.push({ employee_id: emp.employee_id, error: createError.message })
        }
        continue
      }

      console.log(`  ✗ Lỗi tạo auth user: ${createError.message}`)
      errorCount++
      errors.push({ employee_id: emp.employee_id, error: createError.message })
      continue
    }

    if (!authData?.user?.id) {
      console.log(`  ✗ Tạo auth user thành công nhưng không nhận được UUID`)
      errorCount++
      errors.push({ employee_id: emp.employee_id, error: 'Không nhận được UUID từ Supabase Auth' })
      continue
    }

    const authUserId = authData.user.id

    const { error: updateError } = await supabase
      .from('employees')
      .update({ auth_user_id: authUserId })
      .eq('id', emp.id)

    if (updateError) {
      console.log(`  ✗ Tạo auth user OK nhưng lỗi cập nhật auth_user_id: ${updateError.message}`)
      errorCount++
      errors.push({ employee_id: emp.employee_id, error: `Cập nhật auth_user_id thất bại: ${updateError.message}` })
      continue
    }

    console.log(`  ✓ Tạo thành công → auth_user_id: ${authUserId}`)
    successCount++
  }

  console.log('\n=== VERIFICATION ===')
  const { data: remaining, error: verifyError } = await supabase
    .from('employees')
    .select('id, employee_id')
    .eq('is_active', true)
    .not('password_hash', 'is', null)
    .is('auth_user_id', null)

  if (verifyError) {
    console.log(`Lỗi khi kiểm tra: ${verifyError.message}`)
  } else {
    const remainingCount = remaining?.length || 0
    if (remainingCount === 0) {
      console.log('✓ Tất cả nhân viên active có password đã được migrate.')
    } else {
      console.log(`⚠ Còn ${remainingCount} nhân viên chưa migrate:`)
      remaining?.forEach((r) => console.log(`  - ${r.employee_id}`))
    }
  }

  console.log('\n=== KẾT QUẢ ===')
  console.log(`Thành công : ${successCount}`)
  console.log(`Bỏ qua     : ${skipCount}`)
  console.log(`Lỗi        : ${errorCount}`)
  console.log(`Tổng       : ${employees.length}`)

  if (errors.length > 0) {
    console.log('\nChi tiết lỗi:')
    errors.forEach((e) => console.log(`  [${e.employee_id}] ${e.error}`))
  }

  console.log('\n=== HOÀN TẤT ===')
}

migrateAuthUsers().catch((err) => {
  console.error('Lỗi không mong đợi:', err)
  process.exit(1)
})
