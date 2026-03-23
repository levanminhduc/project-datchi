/**
 * Shared Error Message Utilities
 *
 * Centralized error message handling for Vietnamese user feedback.
 * Reduces duplication across composables.
 */
/**
 * Common error messages used across the application
 */
export declare const COMMON_ERROR_MESSAGES: {
    readonly NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra mạng";
    readonly SERVER_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau";
    readonly TIMEOUT_ERROR: "Yêu cầu quá thời gian. Vui lòng thử lại";
    readonly NOT_FOUND: "Không tìm thấy dữ liệu";
    readonly DUPLICATE: "Dữ liệu đã tồn tại";
    readonly VALIDATION_ERROR: "Dữ liệu không hợp lệ";
    readonly UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này";
    readonly FORBIDDEN: "Truy cập bị từ chối";
};
/**
 * Type for custom message mapping
 */
export interface ErrorMessageMap {
    networkError?: string;
    serverError?: string;
    timeoutError?: string;
    notFound?: string;
    duplicate?: string;
    [key: string]: string | undefined;
}
/**
 * Parse error and return appropriate Vietnamese message
 *
 * @param error - The error to parse (unknown type for maximum compatibility)
 * @param fallback - Fallback message if no specific match found
 * @param customMessages - Optional custom message overrides
 * @returns User-friendly Vietnamese error message
 *
 * @example
 * // Basic usage
 * const message = getErrorMessage(error)
 *
 * @example
 * // With custom fallback
 * const message = getErrorMessage(error, 'Không thể tải dữ liệu')
 *
 * @example
 * // With custom messages
 * const message = getErrorMessage(error, undefined, {
 *   duplicate: 'Mã nhân viên đã tồn tại',
 *   notFound: 'Không tìm thấy nhân viên'
 * })
 */
export declare function getErrorMessage(error: unknown, fallback?: string, customMessages?: ErrorMessageMap): string;
/**
 * Create a domain-specific error message handler
 *
 * @param domainMessages - Custom messages for a specific domain
 * @returns A bound getErrorMessage function with custom messages
 *
 * @example
 * const getEmployeeError = createErrorHandler({
 *   duplicate: 'Mã nhân viên đã tồn tại',
 *   notFound: 'Không tìm thấy nhân viên'
 * })
 *
 * // Usage
 * const message = getEmployeeError(error)
 */
export declare function createErrorHandler(domainMessages: ErrorMessageMap): (error: unknown, fallback?: string) => string;
