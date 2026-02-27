/**
 * Frontend Supabase Client
 *
 * Client-side Supabase instance for authentication and real-time subscriptions.
 * Uses anon key only (RLS enforced).
 * Backend operations should use server/db/supabase.ts instead.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'http://127.0.0.1:54321'

// Docker mode: VITE_SUPABASE_URL="/supabase" → resolve to full URL using current origin
const resolvedSupabaseUrl = supabaseUrl.startsWith('/')
  ? `${window.location.origin}${supabaseUrl}`
  : supabaseUrl

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  ''

if (!supabaseAnonKey) {
  console.warn(
    '[Supabase] Warning: VITE_SUPABASE_ANON_KEY is not set. Real-time features may not work.'
  )
}

/**
 * Frontend Supabase client with anon key
 * Use for authentication and real-time subscriptions
 * All CRUD operations should go through the Hono API
 */
export const supabase = createClient(resolvedSupabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

console.log(`[Supabase] Frontend client initialized with URL: ${resolvedSupabaseUrl}`)
