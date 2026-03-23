"use strict";
// src/router/guards.ts
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
exports.setupRouterGuards = setupRouterGuards;
var useAuth_1 = require("@/composables/useAuth");
/**
 * Setup router navigation guards for authentication and authorization
 *
 * IMPORTANT: All routes require authentication BY DEFAULT.
 * Only routes explicitly marked with `public: true` can be accessed without login.
 *
 * Permission check order:
 * 1. Public routes (meta.public: true) - allow without auth
 * 2. Auth check - redirect to login if not authenticated
 * 3. ROOT check - if user is ROOT, bypass all permission checks
 * 4. Admin check - if route requires admin
 * 5. Permission checks - OR logic or AND logic
 */
function setupRouterGuards(router) {
    var _this = this;
    router.beforeEach(function (to, _from, next) { return __awaiter(_this, void 0, void 0, function () {
        var auth, meta, isPublicRoute, hasAccess, hasAllAccess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = (0, useAuth_1.useAuth)();
                    meta = to.meta;
                    // Initialize auth state if not done (restores session from Supabase Auth)
                    return [4 /*yield*/, auth.init()
                        // Check if route is public (explicitly marked as public: true)
                        // Also support legacy requiresAuth: false for backward compatibility
                    ];
                case 1:
                    // Initialize auth state if not done (restores session from Supabase Auth)
                    _a.sent();
                    isPublicRoute = meta.public === true || meta.requiresAuth === false;
                    if (isPublicRoute) {
                        // Public route - allow access
                        // But redirect to home if already authenticated and trying to access login
                        if (to.path === '/login' && auth.isAuthenticated.value) {
                            return [2 /*return*/, next('/')];
                        }
                        return [2 /*return*/, next()];
                    }
                    // All other routes require authentication by default
                    if (!auth.isAuthenticated.value) {
                        return [2 /*return*/, next({
                                path: '/login',
                                query: { redirect: to.fullPath },
                            })];
                    }
                    // ROOT bypasses ALL permission checks
                    if (auth.checkIsRoot()) {
                        return [2 /*return*/, next()];
                    }
                    // Check if route requires ROOT only
                    if (meta.requiresRoot) {
                        return [2 /*return*/, next('/forbidden')]; // Not ROOT, deny access
                    }
                    // Check if route requires admin (ROOT or admin role)
                    if (meta.requiresAdmin) {
                        if (!auth.isAdmin()) {
                            return [2 /*return*/, next('/forbidden')];
                        }
                        // Admin check passed, continue
                    }
                    // Check permissions (OR logic)
                    if (meta.permissions && meta.permissions.length > 0) {
                        hasAccess = auth.hasAnyPermission(meta.permissions);
                        if (!hasAccess) {
                            return [2 /*return*/, next(meta.redirectTo || '/forbidden')];
                        }
                    }
                    // Check all permissions (AND logic)
                    if (meta.allPermissions && meta.allPermissions.length > 0) {
                        hasAllAccess = auth.hasAllPermissions(meta.allPermissions);
                        if (!hasAllAccess) {
                            return [2 /*return*/, next(meta.redirectTo || '/forbidden')];
                        }
                    }
                    // All checks passed
                    next();
                    return [2 /*return*/];
            }
        });
    }); });
    // Update page title from route meta
    router.afterEach(function (to) {
        var meta = to.meta;
        if (meta.title) {
            document.title = "".concat(meta.title, " | Qu\u1EA3n l\u00FD Kho Ch\u1EC9");
        }
    });
}
