/**
 * Employee Management Type Definitions
 *
 * User-Provided Structure - do not modify field names or casing
 */
/**
 * Employee entity matching database schema
 * Field names match actual database columns
 */
export interface Employee {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    chuc_vu: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface EmployeeDetail extends Employee {
    last_login_at: string | null;
    must_change_password: boolean | null;
    password_changed_at: string | null;
    failed_login_attempts: number | null;
    locked_until: string | null;
}
/**
 * Form data for create/update operations
 * Excludes id and timestamps which are managed by backend
 */
export interface EmployeeFormData {
    employee_id: string;
    full_name: string;
    department: string;
    chuc_vu: string;
}
/**
 * Filters for employee search/filter functionality
 */
export interface EmployeeFilters {
    search?: string;
    department?: string;
    chuc_vu?: string;
}
/**
 * Generic API response wrapper
 * Used for single entity responses
 */
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    message?: string;
}
/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}
