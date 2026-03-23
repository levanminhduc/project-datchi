"use strict";
/**
 * useOfflineOperation Composable
 *
 * Wraps API operations with offline-aware behavior.
 * Automatically queues operations when offline and syncs when back online.
 */
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
exports.useOfflineOperation = useOfflineOperation;
var vue_1 = require("vue");
var offlineQueue_1 = require("@/stores/thread/offlineQueue");
var pinia_1 = require("pinia");
var useSnackbar_1 = require("@/composables/useSnackbar");
var MESSAGES = {
    QUEUED: 'Thao tác đã lưu, sẽ đồng bộ khi có mạng',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
};
function useOfflineOperation() {
    var store = (0, offlineQueue_1.useOfflineQueueStore)();
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var _a = (0, pinia_1.storeToRefs)(store), isOnline = _a.isOnline, isSyncing = _a.isSyncing, pendingCount = _a.pendingCount, failedCount = _a.failedCount, conflictCount = _a.conflictCount, hasConflicts = _a.hasConflicts;
    /**
     * Execute an operation with offline-aware behavior.
     * - If online: attempts to execute immediately
     * - If offline or execution fails: queues for later sync
     */
    function execute(options) {
        return __awaiter(this, void 0, void 0, function () {
            var type, onlineExecutor, payload, successMessage, queuedMessage, data, err_1, isNetworkError, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        type = options.type, onlineExecutor = options.onlineExecutor, payload = options.payload, successMessage = options.successMessage, queuedMessage = options.queuedMessage;
                        if (!!store.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, store.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!isOnline.value) return [3 /*break*/, 8];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 8]);
                        return [4 /*yield*/, onlineExecutor()];
                    case 4:
                        data = _a.sent();
                        if (successMessage) {
                            snackbar.success(successMessage);
                        }
                        return [2 /*return*/, {
                                success: true,
                                queued: false,
                                data: data,
                            }];
                    case 5:
                        err_1 = _a.sent();
                        isNetworkError = err_1 instanceof Error &&
                            (err_1.message.includes('fetch') ||
                                err_1.message.includes('network') ||
                                err_1.message.includes('Failed to fetch'));
                        if (!isNetworkError) return [3 /*break*/, 7];
                        // Queue the operation
                        return [4 /*yield*/, store.enqueue({ type: type, payload: payload })];
                    case 6:
                        // Queue the operation
                        _a.sent();
                        snackbar.info(queuedMessage || MESSAGES.QUEUED);
                        return [2 /*return*/, {
                                success: false,
                                queued: true,
                            }];
                    case 7:
                        errorMessage = err_1 instanceof Error ? err_1.message : MESSAGES.NETWORK_ERROR;
                        snackbar.error(errorMessage);
                        return [2 /*return*/, {
                                success: false,
                                queued: false,
                                error: errorMessage,
                            }];
                    case 8: 
                    // Offline - queue the operation
                    return [4 /*yield*/, store.enqueue({ type: type, payload: payload })];
                    case 9:
                        // Offline - queue the operation
                        _a.sent();
                        snackbar.info(queuedMessage || MESSAGES.QUEUED);
                        return [2 /*return*/, {
                                success: false,
                                queued: true,
                            }];
                }
            });
        });
    }
    /**
     * Create an offline-aware wrapper for an API function.
     * Returns a new function that automatically handles offline queueing.
     */
    function createOfflineWrapper(type, apiFunction, options) {
        var _this = this;
        return function (args) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, execute({
                        type: type,
                        onlineExecutor: function () { return apiFunction(args); },
                        payload: args,
                        successMessage: options === null || options === void 0 ? void 0 : options.successMessage,
                        queuedMessage: options === null || options === void 0 ? void 0 : options.queuedMessage,
                    })];
            });
        }); };
    }
    /**
     * Manually trigger sync of pending operations
     */
    function syncNow() {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isOnline.value) {
                            snackbar.warning('Không có kết nối mạng');
                            return [2 /*return*/, null];
                        }
                        if (isSyncing.value) {
                            snackbar.info('Đang đồng bộ...');
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, store.sync()];
                    case 1:
                        result = _a.sent();
                        if (result.success > 0) {
                            snackbar.success("\u0110\u00E3 \u0111\u1ED3ng b\u1ED9 ".concat(result.success, " thao t\u00E1c"));
                        }
                        if (result.failed > 0) {
                            snackbar.warning("".concat(result.failed, " thao t\u00E1c ch\u01B0a \u0111\u1ED3ng b\u1ED9 \u0111\u01B0\u1EE3c"));
                        }
                        if (result.conflicts > 0) {
                            snackbar.error("".concat(result.conflicts, " xung \u0111\u1ED9t c\u1EA7n x\u1EED l\u00FD"));
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
    /**
     * Get the list of pending operations
     */
    var pendingOperations = (0, vue_1.computed)(function () { return store.pendingOperations; });
    /**
     * Get the list of conflict operations
     */
    var conflictOperations = (0, vue_1.computed)(function () { return store.conflictOperations; });
    /**
     * Get the list of failed operations
     */
    var failedOperations = (0, vue_1.computed)(function () { return store.failedOperations; });
    return {
        // State
        isOnline: isOnline,
        isSyncing: isSyncing,
        pendingCount: pendingCount,
        failedCount: failedCount,
        conflictCount: conflictCount,
        hasConflicts: hasConflicts,
        // Operations
        pendingOperations: pendingOperations,
        conflictOperations: conflictOperations,
        failedOperations: failedOperations,
        // Methods
        execute: execute,
        createOfflineWrapper: createOfflineWrapper,
        syncNow: syncNow,
        // Store access for advanced usage
        initialize: store.initialize,
        resolveConflict: store.resolveConflict,
        retryFailed: store.retryFailed,
        clearAll: store.clearAll,
        cleanup: store.cleanup,
    };
}
