import type { LoginCredentials, LoginResponse, EmployeeAuth, ChangePasswordData } from '@/types/auth';
export type AuthErrorType = 'auth' | 'network' | null;
export interface FetchResult<T> {
    data: T | null;
    errorType: AuthErrorType;
}
declare class AuthService {
    signIn(credentials: LoginCredentials): Promise<{
        data: LoginResponse | null;
        error: string | null;
    }>;
    signOut(): Promise<void>;
    fetchCurrentEmployee(): Promise<FetchResult<EmployeeAuth>>;
    fetchPermissions(): Promise<FetchResult<string[]>>;
    changePassword(data: ChangePasswordData): Promise<{
        error: string | null;
    }>;
    authenticatedFetch(url: string, options?: RequestInit): Promise<Response>;
    hasSession(): Promise<boolean>;
}
export declare const authService: AuthService;
export {};
