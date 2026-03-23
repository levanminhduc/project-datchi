"use strict";
/**
 * Shared Error Message Utilities
 *
 * Centralized error message handling for Vietnamese user feedback.
 * Reduces duplication across composables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_ERROR_MESSAGES = void 0;
exports.getErrorMessage = getErrorMessage;
exports.createErrorHandler = createErrorHandler;
var api_1 = require("@/services/api");
/**
 * Common error messages used across the application
 */
exports.COMMON_ERROR_MESSAGES = {
    NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
    SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
    TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    DUPLICATE: 'Dữ liệu đã tồn tại',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
    UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này',
    FORBIDDEN: 'Truy cập bị từ chối',
};
/**
 * Check if a string contains Vietnamese characters
 */
function hasVietnameseCharacters(text) {
    return /[\u00C0-\u1EF9]/.test(text);
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
function getErrorMessage(error, fallback, customMessages) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var messages = {
        networkError: (_a = customMessages === null || customMessages === void 0 ? void 0 : customMessages.networkError) !== null && _a !== void 0 ? _a : exports.COMMON_ERROR_MESSAGES.NETWORK_ERROR,
        serverError: (_b = customMessages === null || customMessages === void 0 ? void 0 : customMessages.serverError) !== null && _b !== void 0 ? _b : exports.COMMON_ERROR_MESSAGES.SERVER_ERROR,
        timeoutError: (_c = customMessages === null || customMessages === void 0 ? void 0 : customMessages.timeoutError) !== null && _c !== void 0 ? _c : exports.COMMON_ERROR_MESSAGES.TIMEOUT_ERROR,
        notFound: (_d = customMessages === null || customMessages === void 0 ? void 0 : customMessages.notFound) !== null && _d !== void 0 ? _d : exports.COMMON_ERROR_MESSAGES.NOT_FOUND,
        duplicate: (_e = customMessages === null || customMessages === void 0 ? void 0 : customMessages.duplicate) !== null && _e !== void 0 ? _e : exports.COMMON_ERROR_MESSAGES.DUPLICATE,
    };
    // Handle ApiError specifically
    if (error instanceof api_1.ApiError) {
        // Prefer explicit backend message whenever available.
        // Backend currently returns many Vietnamese messages without diacritics.
        var apiMessage = (_f = error.message) === null || _f === void 0 ? void 0 : _f.trim();
        if (apiMessage && apiMessage !== 'Đã xảy ra lỗi') {
            return error.message;
        }
        // Map HTTP status codes
        switch (error.status) {
            case 404:
                return messages.notFound;
            case 409:
                return messages.duplicate;
            case 401:
                return (_g = customMessages === null || customMessages === void 0 ? void 0 : customMessages.unauthorized) !== null && _g !== void 0 ? _g : exports.COMMON_ERROR_MESSAGES.UNAUTHORIZED;
            case 403:
                return (_h = customMessages === null || customMessages === void 0 ? void 0 : customMessages.forbidden) !== null && _h !== void 0 ? _h : exports.COMMON_ERROR_MESSAGES.FORBIDDEN;
            case 408:
                return messages.timeoutError;
            default:
                return fallback !== null && fallback !== void 0 ? fallback : messages.serverError;
        }
    }
    // Handle standard Error objects
    if (error instanceof Error) {
        var message = error.message.toLowerCase();
        // Check for specific error types
        if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
            return messages.networkError;
        }
        if (message.includes('timeout') || message.includes('abort')) {
            return messages.timeoutError;
        }
        if (message.includes('đã tồn tại') || message.includes('duplicate')) {
            return messages.duplicate;
        }
        if (message.includes('not found') || message.includes('không tìm thấy')) {
            return messages.notFound;
        }
        // Return the error message if it's already in Vietnamese
        if (hasVietnameseCharacters(error.message)) {
            return error.message;
        }
    }
    // Handle string errors
    if (typeof error === 'string') {
        if (hasVietnameseCharacters(error)) {
            return error;
        }
    }
    return fallback !== null && fallback !== void 0 ? fallback : messages.serverError;
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
function createErrorHandler(domainMessages) {
    return function (error, fallback) {
        return getErrorMessage(error, fallback, domainMessages);
    };
}
