"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.getRefreshedSession = getRefreshedSession;
exports.resetLogoutFlag = resetLogoutFlag;
exports.isLogoutInProgress = isLogoutInProgress;
exports.clearAuthSessionLocal = clearAuthSessionLocal;
exports.fetchApiRaw = fetchApiRaw;
exports.fetchApi = fetchApi;
var supabase_1 = require("@/lib/supabase");
var auth_error_utils_1 = require("./auth-error-utils");
var API_BASE_URL = import.meta.env.VITE_API_URL || '';
var REQUEST_TIMEOUT_MS = 10000;
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(status, message) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.name = 'ApiError';
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
var refreshPromise = null;
var isLoggingOut = false;
var CROSS_TAB_CHANNEL_NAME = 'datchi-auth-refresh';
var CROSS_TAB_WAIT_MS = 500;
var refreshChannel = null;
var otherTabRefreshing = false;
function getRefreshChannel() {
    if (typeof BroadcastChannel === 'undefined')
        return null;
    if (!refreshChannel) {
        refreshChannel = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
        refreshChannel.onmessage = function (event) {
            if (event.data.type === 'REFRESH_START') {
                otherTabRefreshing = true;
            }
            if (event.data.type === 'REFRESH_DONE') {
                otherTabRefreshing = false;
            }
        };
    }
    return refreshChannel;
}
function waitForOtherTabRefresh() {
    return __awaiter(this, void 0, void 0, function () {
        var session;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, CROSS_TAB_WAIT_MS); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, supabase_1.supabase.auth.getSession()];
                case 2:
                    session = (_a.sent()).data.session;
                    return [2 /*return*/, session];
            }
        });
    });
}
function clearSupabaseTokens() {
    if (typeof window === 'undefined')
        return;
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('auth-token')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(function (key) { return localStorage.removeItem(key); });
}
function forceBackToLogin() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (typeof window === 'undefined')
                return [2 /*return*/];
            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
            return [2 /*return*/];
        });
    });
}
function resolveRequestUrl(endpointOrUrl) {
    if (endpointOrUrl.startsWith('http://') || endpointOrUrl.startsWith('https://')) {
        return endpointOrUrl;
    }
    return "".concat(API_BASE_URL).concat(endpointOrUrl);
}
function buildRequestHeaders(headers, token, includeJsonContentType) {
    var mergedHeaders = new Headers(headers);
    if (includeJsonContentType && !mergedHeaders.has('Content-Type')) {
        mergedHeaders.set('Content-Type', 'application/json');
    }
    if (token && !mergedHeaders.has('Authorization')) {
        mergedHeaders.set('Authorization', "Bearer ".concat(token));
    }
    return mergedHeaders;
}
function getErrorMessageFromPayload(payload) {
    if (!payload || typeof payload !== 'object')
        return null;
    var record = payload;
    if (typeof record.error === 'string' && record.error.trim()) {
        return record.error;
    }
    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message;
    }
    return null;
}
function getRefreshedSession() {
    return __awaiter(this, void 0, void 0, function () {
        var session, doRefresh;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (refreshPromise) {
                        return [2 /*return*/, refreshPromise];
                    }
                    if (!otherTabRefreshing) return [3 /*break*/, 2];
                    return [4 /*yield*/, waitForOtherTabRefresh()];
                case 1:
                    session = _a.sent();
                    if (session)
                        return [2 /*return*/, session];
                    _a.label = 2;
                case 2:
                    doRefresh = function () { return __awaiter(_this, void 0, void 0, function () {
                        var channel, _a, data, error;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    channel = getRefreshChannel();
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, , 3, 4]);
                                    channel === null || channel === void 0 ? void 0 : channel.postMessage({ type: 'REFRESH_START' });
                                    return [4 /*yield*/, supabase_1.supabase.auth.refreshSession()];
                                case 2:
                                    _a = _b.sent(), data = _a.data, error = _a.error;
                                    if (error) {
                                        if ((0, auth_error_utils_1.isAuthError)(error)) {
                                            throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                                        }
                                        throw new Error('Lỗi kết nối, vui lòng thử lại');
                                    }
                                    if (!data.session) {
                                        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                                    }
                                    return [2 /*return*/, data.session];
                                case 3:
                                    channel === null || channel === void 0 ? void 0 : channel.postMessage({ type: 'REFRESH_DONE' });
                                    refreshPromise = null;
                                    return [7 /*endfinally*/];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    refreshPromise = doRefresh();
                    return [2 /*return*/, refreshPromise];
            }
        });
    });
}
function resetLogoutFlag() {
    isLoggingOut = false;
}
function isLogoutInProgress() {
    return isLoggingOut;
}
function clearAuthSessionLocal() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isLoggingOut = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, supabase_1.supabase.auth.signOut({ scope: 'local' })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    clearSupabaseTokens();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchApiRaw(endpointOrUrl_1) {
    return __awaiter(this, arguments, void 0, function (endpointOrUrl, options, config) {
        var url, includeJsonContentType, timeoutMs, makeRequest, session, token, response, retryResponse, newSession, retriedResponse, finalResponse;
        var _this = this;
        var _a, _b;
        if (options === void 0) { options = {}; }
        if (config === void 0) { config = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = resolveRequestUrl(endpointOrUrl);
                    includeJsonContentType = (_a = config.includeJsonContentType) !== null && _a !== void 0 ? _a : false;
                    timeoutMs = (_b = config.timeout) !== null && _b !== void 0 ? _b : REQUEST_TIMEOUT_MS;
                    makeRequest = function (token) { return __awaiter(_this, void 0, void 0, function () {
                        var controller, timeoutId, headers, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    controller = new AbortController();
                                    timeoutId = setTimeout(function () { return controller.abort(); }, timeoutMs);
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, 4, 5]);
                                    headers = buildRequestHeaders(options.headers, token, includeJsonContentType);
                                    return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { headers: headers, signal: controller.signal }))];
                                case 2: return [2 /*return*/, _a.sent()];
                                case 3:
                                    error_1 = _a.sent();
                                    if (error_1 instanceof Error && error_1.name === 'AbortError') {
                                        throw new ApiError(408, 'Yêu cầu quá thời gian. Vui lòng thử lại');
                                    }
                                    throw error_1;
                                case 4:
                                    clearTimeout(timeoutId);
                                    return [7 /*endfinally*/];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, supabase_1.supabase.auth.getSession()];
                case 1:
                    session = (_c.sent()).data.session;
                    token = session === null || session === void 0 ? void 0 : session.access_token;
                    return [4 /*yield*/, makeRequest(token)];
                case 2:
                    response = _c.sent();
                    if (!(response.status === 503)) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1500); })];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, makeRequest(token)];
                case 4:
                    retryResponse = _c.sent();
                    if (retryResponse.status === 503) {
                        throw new ApiError(503, 'Hệ thống đang tải, vui lòng thử lại sau');
                    }
                    return [2 /*return*/, retryResponse];
                case 5:
                    if (!(response.status === 401)) return [3 /*break*/, 16];
                    if (!!token) return [3 /*break*/, 7];
                    return [4 /*yield*/, forceBackToLogin()];
                case 6:
                    _c.sent();
                    throw new ApiError(401, 'Vui lòng đăng nhập');
                case 7: return [4 /*yield*/, getRefreshedSession()];
                case 8:
                    newSession = _c.sent();
                    return [4 /*yield*/, makeRequest(newSession.access_token)];
                case 9:
                    retriedResponse = _c.sent();
                    if (!(retriedResponse.status === 401)) return [3 /*break*/, 15];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 2000); })];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, makeRequest(newSession.access_token)];
                case 11:
                    finalResponse = _c.sent();
                    if (!(finalResponse.status === 401)) return [3 /*break*/, 14];
                    return [4 /*yield*/, clearAuthSessionLocal()];
                case 12:
                    _c.sent();
                    return [4 /*yield*/, forceBackToLogin()];
                case 13:
                    _c.sent();
                    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                case 14: return [2 /*return*/, finalResponse];
                case 15: return [2 /*return*/, retriedResponse];
                case 16: return [2 /*return*/, response];
            }
        });
    });
}
function fetchApi(endpoint_1) {
    return __awaiter(this, arguments, void 0, function (endpoint, options, config) {
        var response, payload, _a;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetchApiRaw(endpoint, options, {
                        includeJsonContentType: true,
                        timeout: config === null || config === void 0 ? void 0 : config.timeout,
                    })];
                case 1:
                    response = _b.sent();
                    payload = null;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, response.json()];
                case 3:
                    payload = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    payload = null;
                    return [3 /*break*/, 5];
                case 5:
                    if (!response.ok) {
                        throw new ApiError(response.status, getErrorMessageFromPayload(payload) || 'Đã xảy ra lỗi');
                    }
                    return [2 /*return*/, payload];
            }
        });
    });
}
