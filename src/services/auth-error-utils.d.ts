import type { AuthError } from '@supabase/supabase-js';
export declare function isAuthError(error: AuthError | null): boolean;
export declare function isSessionMissingError(error: AuthError | null): boolean;
