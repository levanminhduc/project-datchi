/**
 * Frontend Supabase Client
 *
 * Client-side Supabase instance for real-time subscriptions.
 * Uses anon key only (RLS enforced).
 * Backend operations should use server/db/supabase.ts instead.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'http://127.0.0.1:54321'

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
 * Use for real-time subscriptions only
 * All CRUD operations should go through the Hono API
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

console.log(`[Supabase] Frontend client initialized with URL: ${supabaseUrl}`)
