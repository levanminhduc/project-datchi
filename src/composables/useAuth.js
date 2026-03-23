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
exports.useAuth = useAuth;
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var supabase_1 = require("@/lib/supabase");
var authService_1 = require("@/services/authService");
var api_1 = require("@/services/api");
var auth_error_utils_1 = require("@/services/auth-error-utils");
var useSnackbar_1 = require("@/composables/useSnackbar");
var state = (0, vue_1.ref)({
    employee: null,
    permissions: [],
    isAuthenticated: false,
    isRoot: false,
    isLoading: true,
    error: null,
});
var initialized = false;
var initPromise = null;
var signingOut = false;
var loggedOut = false;
var authListenerUnsubscribe = null;
var sessionResumeListenerCleanup = null;
var lastResumeReinitAt = 0;
var verifiedPermissionsSnapshot = null;
var tempPassword = (0, vue_1.ref)(null);
var RETRY_DELAYS = [0, 500, 1000];
var GET_USER_TIMEOUT = 8000;
var GET_SESSION_TIMEOUT = 8000;
var RESUME_REINIT_DEBOUNCE_MS = 1500;
var SESSION_NEAR_EXPIRY_MS = 5 * 60 * 1000;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
function withTimeout(promise, ms) {
    return __awaiter(this, void 0, void 0, function () {
        var timeout;
        return __generator(this, function (_a) {
            timeout = new Promise(function (resolve) { return setTimeout(function () { return resolve(null); }, ms); });
            return [2 /*return*/, Promise.race([promise, timeout])];
        });
    });
}
function retryGetUser() {
    return __awaiter(this, void 0, void 0, function () {
        var attempt, delay, result, data, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempt = 0;
                    _a.label = 1;
                case 1:
                    if (!(attempt < RETRY_DELAYS.length)) return [3 /*break*/, 6];
                    delay = RETRY_DELAYS[attempt];
                    if (!(attempt > 0 && delay)) return [3 /*break*/, 3];
                    return [4 /*yield*/, sleep(delay)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, withTimeout(supabase_1.supabase.auth.getUser(), GET_USER_TIMEOUT)
                    // Timeout - treat as network error
                ];
                case 4:
                    result = _a.sent();
                    // Timeout - treat as network error
                    if (result === null) {
                        return [3 /*break*/, 5];
                    }
                    data = result.data, error = result.error;
                    // No session = auth error (user needs to login)
                    if (!data.user && !error) {
                        return [2 /*return*/, { user: null, errorType: 'auth' }];
                    }
                    if (!error && data.user) {
                        return [2 /*return*/, { user: data.user, errorType: null }];
                    }
                    if (error) {
                        if ((0, auth_error_utils_1.isAuthError)(error)) {
                            return [2 /*return*/, { user: null, errorType: 'auth' }];
                        }
                    }
                    _a.label = 5;
                case 5:
                    attempt++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, { user: null, errorType: 'network' }];
            }
        });
    });
}
function getSessionSafe() {
    return __awaiter(this, arguments, void 0, function (timeoutMs) {
        var result, _a;
        var _b;
        if (timeoutMs === void 0) { timeoutMs = GET_SESSION_TIMEOUT; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, withTimeout(supabase_1.supabase.auth.getSession(), timeoutMs)];
                case 1:
                    result = _c.sent();
                    if (!result) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, (_b = result.data.session) !== null && _b !== void 0 ? _b : null];
                case 2:
                    _a = _c.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function applyPermissionsSnapshot() {
    if (verifiedPermissionsSnapshot) {
        state.value.permissions = verifiedPermissionsSnapshot;
        state.value.isRoot = verifiedPermissionsSnapshot.includes('*');
    }
}
function preserveExistingAuthStateOnNetworkError() {
    if (!state.value.isAuthenticated || !state.value.employee) {
        return false;
    }
    state.value.isLoading = false;
    state.value.error = 'network';
    applyPermissionsSnapshot();
    initialized = false;
    return true;
}
function useAuth() {
    var router = (0, vue_router_1.useRouter)();
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var employee = (0, vue_1.computed)(function () { return state.value.employee; });
    var isAuthenticated = (0, vue_1.computed)(function () { return state.value.isAuthenticated; });
    var isLoading = (0, vue_1.computed)(function () { return state.value.isLoading; });
    var permissions = (0, vue_1.computed)(function () { return state.value.permissions; });
    var error = (0, vue_1.computed)(function () { return state.value.error; });
    var isRoot = (0, vue_1.computed)(function () { return state.value.isRoot; });
    function init() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!initPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, initPromise];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (initialized || signingOut) {
                            return [2 /*return*/];
                        }
                        if (loggedOut) {
                            resetState();
                            return [2 /*return*/];
                        }
                        // Create promise for this init
                        initPromise = doInit();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, initPromise];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        initPromise = null;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function doInit() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, user, getUserErrorType, session, _b, emp, empErrorType, session, _c, perms, permsErrorType, finalPerms, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        initialized = true;
                        setupAuthListener();
                        setupSessionResumeListener();
                        state.value.isLoading = true;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 15, , 16]);
                        return [4 /*yield*/, retryGetUser()];
                    case 2:
                        _a = _e.sent(), user = _a.user, getUserErrorType = _a.errorType;
                        if (getUserErrorType === 'auth') {
                            // Don't call clearAuthSessionLocal() here - it triggers SIGNED_OUT event
                            // which causes router navigation → deadlock with initPromise
                            // Guard will redirect to /login since isAuthenticated=false
                            resetState();
                            return [2 /*return*/];
                        }
                        if (!(getUserErrorType === 'network')) return [3 /*break*/, 4];
                        return [4 /*yield*/, getSessionSafe()];
                    case 3:
                        session = _e.sent();
                        if (session) {
                            state.value.isAuthenticated = true;
                            state.value.error = 'network';
                            state.value.isLoading = false;
                            applyPermissionsSnapshot();
                            initialized = false;
                            snackbar.error('Lỗi kết nối mạng. Đang thử khôi phục phiên...');
                            return [2 /*return*/];
                        }
                        if (preserveExistingAuthStateOnNetworkError()) {
                            snackbar.error('Kết nối bị gián đoạn khi khôi phục phiên. Đang thử lại...');
                            return [2 /*return*/];
                        }
                        resetState();
                        initialized = false;
                        return [2 /*return*/];
                    case 4:
                        if (!user) {
                            resetState();
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, authService_1.authService.fetchCurrentEmployee()];
                    case 5:
                        _b = _e.sent(), emp = _b.data, empErrorType = _b.errorType;
                        if (empErrorType === 'auth') {
                            resetState();
                            return [2 /*return*/];
                        }
                        if (!(empErrorType === 'network')) return [3 /*break*/, 7];
                        return [4 /*yield*/, getSessionSafe()];
                    case 6:
                        session = _e.sent();
                        if (session) {
                            state.value.isAuthenticated = true;
                            state.value.error = 'network';
                            state.value.isLoading = false;
                            applyPermissionsSnapshot();
                            initialized = false;
                            snackbar.error('Lỗi kết nối mạng. Đang thử khôi phục phiên...');
                            return [2 /*return*/];
                        }
                        if (preserveExistingAuthStateOnNetworkError()) {
                            snackbar.error('Kết nối bị gián đoạn khi khôi phục phiên. Đang thử lại...');
                            return [2 /*return*/];
                        }
                        resetState();
                        initialized = false;
                        return [2 /*return*/];
                    case 7:
                        if (!!emp) return [3 /*break*/, 9];
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 8:
                        _e.sent();
                        resetState();
                        return [2 /*return*/];
                    case 9:
                        if (!emp.mustChangePassword) return [3 /*break*/, 11];
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 10:
                        _e.sent();
                        resetState();
                        initialized = false;
                        router.push('/login');
                        return [2 /*return*/];
                    case 11: return [4 /*yield*/, authService_1.authService.fetchPermissions()];
                    case 12:
                        _c = _e.sent(), perms = _c.data, permsErrorType = _c.errorType;
                        if (!(permsErrorType === 'auth')) return [3 /*break*/, 14];
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 13:
                        _e.sent();
                        resetState();
                        initialized = false;
                        return [2 /*return*/];
                    case 14:
                        finalPerms = permsErrorType === 'network' && verifiedPermissionsSnapshot
                            ? verifiedPermissionsSnapshot
                            : perms !== null && perms !== void 0 ? perms : [];
                        if (perms) {
                            verifiedPermissionsSnapshot = perms;
                        }
                        state.value = {
                            employee: emp,
                            permissions: finalPerms,
                            isAuthenticated: true,
                            isRoot: emp.isRoot || finalPerms.includes('*'),
                            isLoading: false,
                            error: permsErrorType === 'network' ? 'network' : null,
                        };
                        return [3 /*break*/, 16];
                    case 15:
                        _d = _e.sent();
                        resetState();
                        state.value.error = 'Không thể khởi tạo phiên đăng nhập';
                        initialized = false;
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    }
    function setupAuthListener() {
        var _this = this;
        if (authListenerUnsubscribe)
            return;
        var handlingTokenRefresh = false;
        var handlingSignedOut = false;
        var handleSignedOutEvent = function () { return __awaiter(_this, void 0, void 0, function () {
            var session, isOnLoginPage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (signingOut || (0, api_1.isLogoutInProgress)() || handlingSignedOut)
                            return [2 /*return*/];
                        handlingSignedOut = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 6, 7]);
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 150); })];
                    case 2:
                        _a.sent();
                        if (signingOut || (0, api_1.isLogoutInProgress)())
                            return [2 /*return*/];
                        return [4 /*yield*/, getSessionSafe(3000)];
                    case 3:
                        session = _a.sent();
                        if (session) {
                            return [2 /*return*/];
                        }
                        resetState();
                        initialized = false;
                        isOnLoginPage = router.currentRoute.value.path === '/login';
                        if (!!isOnLoginPage) return [3 /*break*/, 5];
                        snackbar.error('Phiên đăng nhập đã hết hạn');
                        return [4 /*yield*/, router.replace('/login').catch(function () {
                                window.location.replace('/login');
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        handlingSignedOut = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        var handleTokenRefreshedEvent = function (session) { return __awaiter(_this, void 0, void 0, function () {
            var _a, emp, empErrorType, _b, perms, permsErrorType;
            var _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (handlingTokenRefresh)
                            return [2 /*return*/];
                        handlingTokenRefresh = true;
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, , 12, 13]);
                        if (!(session === null || session === void 0 ? void 0 : session.access_token)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, authService_1.authService.fetchCurrentEmployee()];
                    case 2:
                        _a = _f.sent(), emp = _a.data, empErrorType = _a.errorType;
                        if (!(empErrorType === 'auth')) return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 3:
                        _f.sent();
                        resetState();
                        initialized = false;
                        if (!(router.currentRoute.value.path !== '/login')) return [3 /*break*/, 5];
                        return [4 /*yield*/, router.replace('/login').catch(function () {
                                window.location.replace('/login');
                            })];
                    case 4:
                        _f.sent();
                        _f.label = 5;
                    case 5: return [2 /*return*/];
                    case 6:
                        if (empErrorType === 'network') {
                            console.warn('[useAuth] Token refreshed but backend unreachable — keeping current session');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, authService_1.authService.fetchPermissions()];
                    case 7:
                        _b = _f.sent(), perms = _b.data, permsErrorType = _b.errorType;
                        if (!(permsErrorType === 'auth')) return [3 /*break*/, 11];
                        return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 8:
                        _f.sent();
                        resetState();
                        initialized = false;
                        if (!(router.currentRoute.value.path !== '/login')) return [3 /*break*/, 10];
                        return [4 /*yield*/, router.replace('/login').catch(function () {
                                window.location.replace('/login');
                            })];
                    case 9:
                        _f.sent();
                        _f.label = 10;
                    case 10: return [2 /*return*/];
                    case 11:
                        if (permsErrorType === 'network') {
                            console.warn('[useAuth] Token refreshed but backend unreachable — keeping current session');
                            return [2 /*return*/];
                        }
                        if (emp) {
                            state.value.employee = emp;
                        }
                        if (perms !== null) {
                            state.value.permissions = perms;
                            verifiedPermissionsSnapshot = perms;
                            state.value.isRoot = ((_e = (_c = emp === null || emp === void 0 ? void 0 : emp.isRoot) !== null && _c !== void 0 ? _c : (_d = state.value.employee) === null || _d === void 0 ? void 0 : _d.isRoot) !== null && _e !== void 0 ? _e : false) || perms.includes('*');
                        }
                        if (state.value.error === 'network') {
                            state.value.error = null;
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        handlingTokenRefresh = false;
                        return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        }); };
        var subscription = supabase_1.supabase.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT') {
                void handleSignedOutEvent();
            }
            if (event === 'TOKEN_REFRESHED') {
                // Keep callback synchronous to avoid Supabase auth lock deadlocks.
                void handleTokenRefreshedEvent(session);
            }
        }).data.subscription;
        authListenerUnsubscribe = function () { return subscription.unsubscribe(); };
    }
    function setupSessionResumeListener() {
        var _this = this;
        if (typeof window === 'undefined' || sessionResumeListenerCleanup)
            return;
        var revalidateAuthOnResume = function () { return __awaiter(_this, void 0, void 0, function () {
            var now, session, expiresAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (document.visibilityState === 'hidden')
                            return [2 /*return*/];
                        if (signingOut || loggedOut || !state.value.isAuthenticated)
                            return [2 /*return*/];
                        now = Date.now();
                        if (now - lastResumeReinitAt < RESUME_REINIT_DEBOUNCE_MS) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getSessionSafe(3000)];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            lastResumeReinitAt = now;
                            initialized = false;
                            void init();
                            return [2 /*return*/];
                        }
                        expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
                        if (expiresAt - now > SESSION_NEAR_EXPIRY_MS) {
                            return [2 /*return*/];
                        }
                        lastResumeReinitAt = now;
                        initialized = false;
                        void init();
                        return [2 /*return*/];
                }
            });
        }); };
        window.addEventListener('focus', revalidateAuthOnResume);
        document.addEventListener('visibilitychange', revalidateAuthOnResume);
        sessionResumeListenerCleanup = function () {
            window.removeEventListener('focus', revalidateAuthOnResume);
            document.removeEventListener('visibilitychange', revalidateAuthOnResume);
        };
    }
    function resetState() {
        state.value = {
            employee: null,
            permissions: [],
            isAuthenticated: false,
            isRoot: false,
            isLoading: false,
            error: null,
        };
    }
    function signIn(credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, signInError, perms, err_1, message;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loggedOut = false;
                        state.value.isLoading = true;
                        state.value.error = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.signIn(credentials)];
                    case 2:
                        _a = _b.sent(), data = _a.data, signInError = _a.error;
                        if (signInError || !data) {
                            state.value.error = signInError || 'Đăng nhập thất bại';
                            snackbar.error(state.value.error);
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, authService_1.authService.fetchPermissions()];
                    case 3:
                        perms = (_b.sent()).data;
                        if (perms) {
                            verifiedPermissionsSnapshot = perms;
                        }
                        state.value = {
                            employee: data.employee,
                            permissions: perms !== null && perms !== void 0 ? perms : [],
                            isAuthenticated: true,
                            isRoot: data.employee.isRoot || (perms !== null && perms !== void 0 ? perms : []).includes('*'),
                            isLoading: false,
                            error: null,
                        };
                        snackbar.success('Đăng nhập thành công');
                        if (data.employee.mustChangePassword) {
                            tempPassword.value = credentials.password;
                        }
                        (0, api_1.resetLogoutFlag)();
                        setupAuthListener();
                        setupSessionResumeListener();
                        initialized = true;
                        return [2 /*return*/, true];
                    case 4:
                        err_1 = _b.sent();
                        message = err_1 instanceof Error ? err_1.message : 'Đăng nhập thất bại';
                        state.value.error = message;
                        snackbar.error(state.value.error);
                        return [2 /*return*/, false];
                    case 5:
                        state.value.isLoading = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function signOut() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        signingOut = true;
                        loggedOut = true;
                        verifiedPermissionsSnapshot = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 8, 9]);
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, authService_1.authService.signOut()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, (0, api_1.clearAuthSessionLocal)()];
                    case 6:
                        _b.sent();
                        snackbar.success('Đã đăng xuất');
                        resetState();
                        initialized = false;
                        return [4 /*yield*/, router.push('/login').catch(function () {
                                window.location.replace('/login');
                            })];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        signingOut = false;
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    function changePassword(data) {
        return __awaiter(this, void 0, void 0, function () {
            var changeError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, authService_1.authService.changePassword(data)];
                    case 1:
                        changeError = (_a.sent()).error;
                        if (changeError) {
                            snackbar.error(changeError);
                            return [2 /*return*/, false];
                        }
                        if (state.value.employee) {
                            state.value.employee.mustChangePassword = false;
                        }
                        tempPassword.value = null;
                        snackbar.success('Đổi mật khẩu thành công');
                        return [2 /*return*/, true];
                }
            });
        });
    }
    function checkIsRoot() {
        return state.value.isRoot;
    }
    function hasPermission(permission) {
        if (state.value.isRoot)
            return true;
        return state.value.permissions.includes(permission);
    }
    function hasAnyPermission(perms) {
        if (state.value.isRoot)
            return true;
        return perms.some(function (p) { return state.value.permissions.includes(p); });
    }
    function hasAllPermissions(perms) {
        if (state.value.isRoot)
            return true;
        return perms.every(function (p) { return state.value.permissions.includes(p); });
    }
    function hasRole(roleCode) {
        var _a, _b, _c;
        return (_c = (_b = (_a = state.value.employee) === null || _a === void 0 ? void 0 : _a.roles) === null || _b === void 0 ? void 0 : _b.some(function (r) { return r.code === roleCode; })) !== null && _c !== void 0 ? _c : false;
    }
    function isAdmin() {
        return state.value.isRoot || hasRole('admin');
    }
    function refreshPermissions() {
        return __awaiter(this, void 0, void 0, function () {
            var perms;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!state.value.isAuthenticated)
                            return [2 /*return*/];
                        return [4 /*yield*/, authService_1.authService.fetchPermissions()];
                    case 1:
                        perms = (_a.sent()).data;
                        if (perms !== null) {
                            state.value.permissions = perms;
                            verifiedPermissionsSnapshot = perms;
                            state.value.isRoot = perms.includes('*') || hasRole('root');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    return {
        employee: (0, vue_1.readonly)(employee),
        isAuthenticated: (0, vue_1.readonly)(isAuthenticated),
        isLoading: (0, vue_1.readonly)(isLoading),
        permissions: (0, vue_1.readonly)(permissions),
        error: (0, vue_1.readonly)(error),
        isRoot: (0, vue_1.readonly)(isRoot),
        tempPassword: (0, vue_1.readonly)(tempPassword),
        init: init,
        signIn: signIn,
        signOut: signOut,
        changePassword: changePassword,
        refreshPermissions: refreshPermissions,
        hasPermission: hasPermission,
        hasAnyPermission: hasAnyPermission,
        hasAllPermissions: hasAllPermissions,
        hasRole: hasRole,
        isAdmin: isAdmin,
        checkIsRoot: checkIsRoot,
    };
}
