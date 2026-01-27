/**
 * Supabase Database Client
 *
 * Initializes connection to Supabase PostgreSQL database
 * Uses environment variables for configuration
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Read Supabase configuration from environment
// Using NEXT_PUBLIC_ prefix as specified in .env file
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate configuration
if (!supabaseServiceRoleKey) {
  console.warn(
    'Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Backend database operations may fail due to RLS.'
  )
}

/**
 * Supabase client with anon key (for frontend-like operations)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Supabase admin client with service_role key
 * BYPASSES RLS - use for backend operations only
 * NEVER expose this to the frontend
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log(`Supabase client initialized with URL: ${supabaseUrl}`)
