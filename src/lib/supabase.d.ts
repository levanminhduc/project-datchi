/**
 * Frontend Supabase Client
 *
 * Client-side Supabase instance for authentication and real-time subscriptions.
 * Uses anon key only (RLS enforced).
 * Backend operations should use server/db/supabase.ts instead.
 */
/**
 * Frontend Supabase client with anon key
 * Use for authentication and real-time subscriptions
 * All CRUD operations should go through the Hono API
 */
export declare const supabase: any;
