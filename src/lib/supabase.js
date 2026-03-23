"use strict";
/**
 * Frontend Supabase Client
 *
 * Client-side Supabase instance for authentication and real-time subscriptions.
 * Uses anon key only (RLS enforced).
 * Backend operations should use server/db/supabase.ts instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    'http://127.0.0.1:55421';
// Docker mode: VITE_SUPABASE_URL="/supabase" → resolve to full URL using current origin
var resolvedSupabaseUrl = supabaseUrl.startsWith('/')
    ? "".concat(window.location.origin).concat(supabaseUrl)
    : supabaseUrl;
var supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
if (!supabaseAnonKey) {
    console.warn('[Supabase] Warning: VITE_SUPABASE_ANON_KEY is not set. Real-time features may not work.');
}
/**
 * Frontend Supabase client with anon key
 * Use for authentication and real-time subscriptions
 * All CRUD operations should go through the Hono API
 */
exports.supabase = (0, supabase_js_1.createClient)(resolvedSupabaseUrl, supabaseAnonKey, {
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
});
