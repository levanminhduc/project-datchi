"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthError = isAuthError;
exports.isSessionMissingError = isSessionMissingError;
var AUTH_ERROR_CODES = [
    'invalid_grant',
    'refresh_token_revoked',
    'refresh_token_already_used',
    'session_not_found',
    'session_expired',
    'refresh_token_not_found',
    'bad_jwt',
    'invalid_refresh_token',
];
var AUTH_ERROR_MESSAGES = [
    'Auth session missing',
    'Invalid Refresh Token',
    'Refresh Token Not Found',
    'Token expired',
];
function isAuthError(error) {
    if (!error)
        return false;
    if (error.name === 'AuthSessionMissingError')
        return true;
    if (error.status === 401 || error.status === 403)
        return true;
    if (AUTH_ERROR_MESSAGES.some(function (msg) { var _a; return (_a = error.message) === null || _a === void 0 ? void 0 : _a.includes(msg); }))
        return true;
    return AUTH_ERROR_CODES.some(function (code) { var _a; return ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes(code)) || error.code === code; });
}
function isSessionMissingError(error) {
    var _a;
    if (!error)
        return false;
    return (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Auth session missing')) ||
        error.name === 'AuthSessionMissingError');
}
