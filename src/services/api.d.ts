import type { Session } from '@supabase/supabase-js';
type RequestOptions = RequestInit & {
    headers?: HeadersInit;
};
export declare class ApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function getRefreshedSession(): Promise<Session>;
export declare function resetLogoutFlag(): void;
export declare function isLogoutInProgress(): boolean;
export declare function clearAuthSessionLocal(): Promise<void>;
export declare function fetchApiRaw(endpointOrUrl: string, options?: RequestOptions, config?: {
    includeJsonContentType?: boolean;
    timeout?: number;
}): Promise<Response>;
export declare function fetchApi<T>(endpoint: string, options?: RequestOptions, config?: {
    timeout?: number;
}): Promise<T>;
export {};
