import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'fs'
import dotenv from 'dotenv'

if (existsSync('.env')) {
  dotenv.config()
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceRoleKey) {
  console.warn(
    'Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Backend database operations may fail due to RLS.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log(`Supabase client initialized with URL: ${supabaseUrl}`)
