"use strict";
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
exports.authService = void 0;
var supabase_1 = require("@/lib/supabase");
var api_1 = require("./api");
var HAS_SESSION_TIMEOUT_MS = 3000;
function withTimeout(promise, timeoutMs) {
    return __awaiter(this, void 0, void 0, function () {
        var timeout;
        return __generator(this, function (_a) {
            timeout = new Promise(function (resolve) {
                setTimeout(function () { return resolve(null); }, timeoutMs);
            });
            return [2 /*return*/, Promise.race([promise, timeout])];
        });
    });
}
var AuthService = /** @class */ (function () {
    function AuthService() {
    }
    AuthService.prototype.signIn = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var email, _a, authData, signInError, _b, employee, errorType, msg, err_1;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, , 6]);
                        email = "".concat(credentials.employeeId.toLowerCase(), "@internal.datchi.local");
                        return [4 /*yield*/, supabase_1.supabase.auth.signInWithPassword({
                                email: email,
                                password: credentials.password,
                            })];
                    case 1:
                        _a = _d.sent(), authData = _a.data, signInError = _a.error;
                        if (signInError) {
                            console.error('[authService] Supabase signIn error:', signInError.message);
                            // Handle specific error cases
                            if (signInError.message === 'Invalid login credentials') {
                                return [2 /*return*/, { data: null, error: 'Mã nhân viên hoặc mật khẩu không đúng' }];
                            }
                            // Handle 400 Bad Request (invalid email format, missing fields, etc.)
                            if (signInError.status === 400) {
                                return [2 /*return*/, { data: null, error: 'Thông tin đăng nhập không hợp lệ' }];
                            }
                            return [2 /*return*/, { data: null, error: signInError.message || 'Đăng nhập thất bại' }];
                        }
                        // Verify we got a valid session
                        if (!((_c = authData === null || authData === void 0 ? void 0 : authData.session) === null || _c === void 0 ? void 0 : _c.access_token)) {
                            console.error('[authService] No session after signIn');
                            return [2 /*return*/, { data: null, error: 'Không thể tạo phiên đăng nhập' }];
                        }
                        return [4 /*yield*/, this.fetchCurrentEmployee()];
                    case 2:
                        _b = _d.sent(), employee = _b.data, errorType = _b.errorType;
                        if (!!employee) return [3 /*break*/, 4];
                        // Sign out if we can't fetch employee data
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 3:
                        // Sign out if we can't fetch employee data
                        _d.sent();
                        msg = errorType === 'network'
                            ? 'Không thể kết nối đến máy chủ'
                            : 'Không thể lấy thông tin nhân viên';
                        return [2 /*return*/, { data: null, error: msg }];
                    case 4: return [2 /*return*/, { data: { employee: employee }, error: null }];
                    case 5:
                        err_1 = _d.sent();
                        console.error('[authService] Sign in error:', err_1);
                        return [2 /*return*/, { data: null, error: 'Không thể kết nối đến máy chủ' }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.signOut = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, supabase_1.supabase.auth.signOut()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.fetchCurrentEmployee = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, api_1.fetchApi)('/api/auth/me')];
                    case 1:
                        response = _a.sent();
                        if (response.error === true || !response.data) {
                            return [2 /*return*/, { data: null, errorType: 'auth' }];
                        }
                        return [2 /*return*/, { data: response.data, errorType: null }];
                    case 2:
                        err_2 = _a.sent();
                        if (err_2 instanceof api_1.ApiError && (err_2.status === 401 || err_2.status === 403 || err_2.status === 404)) {
                            return [2 /*return*/, { data: null, errorType: 'auth' }];
                        }
                        return [2 /*return*/, { data: null, errorType: 'network' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.fetchPermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, api_1.fetchApi)('/api/auth/permissions')];
                    case 1:
                        response = _a.sent();
                        if (response.error === true || !response.data) {
                            return [2 /*return*/, { data: null, errorType: 'auth' }];
                        }
                        return [2 /*return*/, { data: response.data, errorType: null }];
                    case 2:
                        err_3 = _a.sent();
                        if (err_3 instanceof api_1.ApiError && (err_3.status === 401 || err_3.status === 403)) {
                            return [2 /*return*/, { data: null, errorType: 'auth' }];
                        }
                        return [2 /*return*/, { data: null, errorType: 'network' }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.changePassword = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, err_4, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.hasSession()];
                    case 1:
                        if (!(_a.sent())) {
                            return [2 /*return*/, { error: 'Phiên đăng nhập đã hết hạn' }];
                        }
                        return [4 /*yield*/, (0, api_1.fetchApi)('/api/auth/change-password', {
                                method: 'POST',
                                body: JSON.stringify({
                                    currentPassword: data.currentPassword,
                                    newPassword: data.newPassword,
                                }),
                            })];
                    case 2:
                        response = _a.sent();
                        if (response.error === true || typeof response.error === 'string') {
                            return [2 /*return*/, {
                                    error: response.message ||
                                        (typeof response.error === 'string' ? response.error : 'Đổi mật khẩu thất bại'),
                                }];
                        }
                        return [2 /*return*/, { error: null }];
                    case 3:
                        err_4 = _a.sent();
                        message = err_4 instanceof Error ? err_4.message : 'Không thể kết nối đến máy chủ';
                        return [2 /*return*/, { error: message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.authenticatedFetch = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, api_1.fetchApiRaw)(url, options, {
                        includeJsonContentType: typeof options.body === 'string',
                    })];
            });
        });
    };
    AuthService.prototype.hasSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, session, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, withTimeout(supabase_1.supabase.auth.getSession(), HAS_SESSION_TIMEOUT_MS)];
                    case 1:
                        result = _b.sent();
                        if (!result) {
                            return [2 /*return*/, false];
                        }
                        session = result.data.session;
                        return [2 /*return*/, !!(session === null || session === void 0 ? void 0 : session.access_token)];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AuthService;
}());
exports.authService = new AuthService();
