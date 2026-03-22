/**
 * Shared Error Message Utilities
 * 
 * Centralized error message handling for Vietnamese user feedback.
 * Reduces duplication across composables.
 */

import { ApiError } from '@/services/api'

/**
 * Common error messages used across the application
 */
export const COMMON_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  DUPLICATE: 'Dữ liệu đã tồn tại',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này',
  FORBIDDEN: 'Truy cập bị từ chối',
} as const

/**
 * Type for custom message mapping
 */
export interface ErrorMessageMap {
  networkError?: string
  serverError?: string
  timeoutError?: string
  notFound?: string
  duplicate?: string
  [key: string]: string | undefined
}

/**
 * Check if a string contains Vietnamese characters
 */
function hasVietnameseCharacters(text: string): boolean {
  return /[\u00C0-\u1EF9]/.test(text)
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
export function getErrorMessage(
  error: unknown,
  fallback?: string,
  customMessages?: ErrorMessageMap
): string {
  const messages = {
    networkError: customMessages?.networkError ?? COMMON_ERROR_MESSAGES.NETWORK_ERROR,
    serverError: customMessages?.serverError ?? COMMON_ERROR_MESSAGES.SERVER_ERROR,
    timeoutError: customMessages?.timeoutError ?? COMMON_ERROR_MESSAGES.TIMEOUT_ERROR,
    notFound: customMessages?.notFound ?? COMMON_ERROR_MESSAGES.NOT_FOUND,
    duplicate: customMessages?.duplicate ?? COMMON_ERROR_MESSAGES.DUPLICATE,
  }

  // Handle ApiError specifically
  if (error instanceof ApiError) {
    // ApiError messages are already in Vietnamese from the backend
    if (hasVietnameseCharacters(error.message)) {
      return error.message
    }
    
    // Map HTTP status codes
    switch (error.status) {
      case 404:
        return messages.notFound
      case 409:
        return messages.duplicate
      case 401:
        return customMessages?.unauthorized ?? COMMON_ERROR_MESSAGES.UNAUTHORIZED
      case 403:
        return customMessages?.forbidden ?? COMMON_ERROR_MESSAGES.FORBIDDEN
      case 408:
        return messages.timeoutError
      default:
        return fallback ?? messages.serverError
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Check for specific error types
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return messages.networkError
    }
    if (message.includes('timeout') || message.includes('abort')) {
      return messages.timeoutError
    }
    if (message.includes('đã tồn tại') || message.includes('duplicate')) {
      return messages.duplicate
    }
    if (message.includes('not found') || message.includes('không tìm thấy')) {
      return messages.notFound
    }
    
    // Return the error message if it's already in Vietnamese
    if (hasVietnameseCharacters(error.message)) {
      return error.message
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    if (hasVietnameseCharacters(error)) {
      return error
    }
  }
  
  return fallback ?? messages.serverError
}

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
export function createErrorHandler(domainMessages: ErrorMessageMap) {
  return (error: unknown, fallback?: string): string => {
    return getErrorMessage(error, fallback, domainMessages)
  }
}
