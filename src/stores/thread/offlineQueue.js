"use strict";
/**
 * Offline Queue Store
 *
 * Pinia store for managing offline operations with IndexedDB persistence.
 * Queues operations when offline and syncs them when back online.
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOfflineQueueStore = void 0;
var pinia_1 = require("pinia");
var vue_1 = require("vue");
var api_1 = require("@/services/api");
// Constants
var DB_NAME = 'thread-offline-queue';
var STORE_NAME = 'operations';
var DB_VERSION = 1;
var MAX_RETRIES = 3;
// Vietnamese messages
var MESSAGES = {
    SYNC_SUCCESS: 'Đã đồng bộ thành công',
    SYNC_PARTIAL: 'Một số thao tác chưa đồng bộ được',
    SYNC_FAILED: 'Không thể đồng bộ',
    CONFLICT_DETECTED: 'Phát hiện xung đột dữ liệu',
    QUEUED_OFFLINE: 'Đã lưu thao tác, sẽ đồng bộ khi có mạng',
    ONLINE: 'Đã kết nối mạng',
    OFFLINE: 'Mất kết nối - Chế độ offline',
    DB_ERROR: 'Lỗi cơ sở dữ liệu cục bộ',
};
// API endpoints for operation types
var OPERATION_ENDPOINTS = {
    stock_receipt: '/api/inventory/receive',
    issue: '/api/inventory/issue',
    recovery: '/api/recovery',
    allocation: '/api/allocations',
};
/**
 * IndexedDB helper functions
 */
var OfflineDB = /** @class */ (function () {
    function OfflineDB() {
        this.db = null;
    }
    OfflineDB.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.db)
                    return [2 /*return*/, this.db];
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var request = indexedDB.open(DB_NAME, DB_VERSION);
                        request.onerror = function () {
                            console.error('[OfflineDB] Failed to open database:', request.error);
                            reject(new Error(MESSAGES.DB_ERROR));
                        };
                        request.onsuccess = function () {
                            _this.db = request.result;
                            resolve(_this.db);
                        };
                        request.onupgradeneeded = function (event) {
                            var db = event.target.result;
                            // Create operations store with indexes
                            if (!db.objectStoreNames.contains(STORE_NAME)) {
                                var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                                store.createIndex('status', 'status', { unique: false });
                                store.createIndex('type', 'type', { unique: false });
                                store.createIndex('createdAt', 'createdAt', { unique: false });
                            }
                        };
                    })];
            });
        });
    };
    OfflineDB.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readonly');
                                var store = transaction.objectStore(STORE_NAME);
                                var request = store.getAll();
                                request.onsuccess = function () {
                                    var operations = request.result || [];
                                    // Sort by createdAt ascending (oldest first)
                                    operations.sort(function (a, b) { return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); });
                                    resolve(operations);
                                };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    OfflineDB.prototype.add = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readwrite');
                                var store = transaction.objectStore(STORE_NAME);
                                var request = store.add(operation);
                                request.onsuccess = function () { return resolve(); };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    OfflineDB.prototype.update = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readwrite');
                                var store = transaction.objectStore(STORE_NAME);
                                var request = store.put(operation);
                                request.onsuccess = function () { return resolve(); };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    OfflineDB.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readwrite');
                                var store = transaction.objectStore(STORE_NAME);
                                var request = store.delete(id);
                                request.onsuccess = function () { return resolve(); };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    OfflineDB.prototype.deleteByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readwrite');
                                var store = transaction.objectStore(STORE_NAME);
                                var index = store.index('status');
                                var request = index.openCursor(IDBKeyRange.only(status));
                                request.onsuccess = function () {
                                    var cursor = request.result;
                                    if (cursor) {
                                        cursor.delete();
                                        cursor.continue();
                                    }
                                    else {
                                        resolve();
                                    }
                                };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    OfflineDB.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.init()];
                    case 1:
                        db = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var transaction = db.transaction(STORE_NAME, 'readwrite');
                                var store = transaction.objectStore(STORE_NAME);
                                var request = store.clear();
                                request.onsuccess = function () { return resolve(); };
                                request.onerror = function () { return reject(request.error); };
                            })];
                }
            });
        });
    };
    return OfflineDB;
}());
/**
 * Generate unique ID for operations
 */
function generateId() {
    return "".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 11));
}
/**
 * Offline Queue Store
 */
exports.useOfflineQueueStore = (0, pinia_1.defineStore)('offlineQueue', function () {
    // Database instance
    var db = new OfflineDB();
    // State
    var queue = (0, vue_1.ref)([]);
    var isSyncing = (0, vue_1.ref)(false);
    var lastSyncAt = (0, vue_1.ref)(null);
    var isOnline = (0, vue_1.ref)(navigator.onLine);
    var error = (0, vue_1.ref)(null);
    var isInitialized = (0, vue_1.ref)(false);
    // Getters
    var pendingCount = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'pending'; }).length; });
    var failedCount = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'failed'; }).length; });
    var hasConflicts = (0, vue_1.computed)(function () { return queue.value.some(function (op) { return op.status === 'conflict'; }); });
    var conflictCount = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'conflict'; }).length; });
    var pendingOperations = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'pending'; }); });
    var failedOperations = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'failed'; }); });
    var conflictOperations = (0, vue_1.computed)(function () { return queue.value.filter(function (op) { return op.status === 'conflict'; }); });
    // Online/Offline event handlers
    var handleOnline = function () {
        isOnline.value = true;
        console.log('[OfflineQueue] Online - triggering sync');
        // Auto-sync when coming back online
        if (pendingCount.value > 0) {
            sync();
        }
    };
    var handleOffline = function () {
        isOnline.value = false;
        console.log('[OfflineQueue] Offline mode activated');
    };
    /**
     * Initialize the store - load from IndexedDB
     */
    var initialize = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isInitialized.value)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = queue;
                    return [4 /*yield*/, db.getAll()];
                case 2:
                    _a.value = _b.sent();
                    isInitialized.value = true;
                    // Setup online/offline listeners
                    window.addEventListener('online', handleOnline);
                    window.addEventListener('offline', handleOffline);
                    console.log("[OfflineQueue] Initialized with ".concat(queue.value.length, " operations"));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    console.error('[OfflineQueue] Initialization failed:', err_1);
                    error.value = MESSAGES.DB_ERROR;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Add operation to queue
     */
    var enqueue = function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        var newOperation, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newOperation = __assign(__assign({}, operation), { id: generateId(), createdAt: new Date().toISOString(), status: 'pending', retryCount: 0 });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.add(newOperation)];
                case 2:
                    _a.sent();
                    queue.value.push(newOperation);
                    console.log("[OfflineQueue] Enqueued operation: ".concat(newOperation.id, " (").concat(newOperation.type, ")"));
                    // If online, try to sync immediately
                    if (isOnline.value && !isSyncing.value) {
                        sync();
                    }
                    return [2 /*return*/, newOperation.id];
                case 3:
                    err_2 = _a.sent();
                    console.error('[OfflineQueue] Failed to enqueue:', err_2);
                    throw new Error(MESSAGES.DB_ERROR);
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Remove operation from queue
     */
    var dequeue = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.delete(id)];
                case 1:
                    _a.sent();
                    queue.value = queue.value.filter(function (op) { return op.id !== id; });
                    console.log("[OfflineQueue] Dequeued operation: ".concat(id));
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    console.error('[OfflineQueue] Failed to dequeue:', err_3);
                    throw new Error(MESSAGES.DB_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Sync a single operation
     */
    var syncOperation = function (operation) { return __awaiter(void 0, void 0, void 0, function () {
        var endpoint, response, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endpoint = OPERATION_ENDPOINTS[operation.type];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 10]);
                    // Update status to syncing
                    operation.status = 'syncing';
                    return [4 /*yield*/, db.update(operation)
                        // Make API call
                    ];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, api_1.fetchApi)(endpoint, {
                            method: 'POST',
                            body: JSON.stringify(operation.payload),
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.error) return [3 /*break*/, 6];
                    if (!(response.error.includes('409') || response.error.includes('conflict'))) return [3 /*break*/, 5];
                    operation.status = 'conflict';
                    operation.error = MESSAGES.CONFLICT_DETECTED;
                    return [4 /*yield*/, db.update(operation)];
                case 4:
                    _a.sent();
                    return [2 /*return*/, 'conflict'];
                case 5: throw new Error(response.error);
                case 6: 
                // Success - remove from queue
                return [4 /*yield*/, db.delete(operation.id)];
                case 7:
                    // Success - remove from queue
                    _a.sent();
                    return [2 /*return*/, 'synced'];
                case 8:
                    err_4 = _a.sent();
                    operation.retryCount++;
                    if (operation.retryCount >= MAX_RETRIES) {
                        operation.status = 'failed';
                        operation.error = err_4 instanceof Error ? err_4.message : MESSAGES.SYNC_FAILED;
                    }
                    else {
                        operation.status = 'pending';
                    }
                    return [4 /*yield*/, db.update(operation)];
                case 9:
                    _a.sent();
                    console.error("[OfflineQueue] Sync failed for ".concat(operation.id, ":"), err_4);
                    return [2 /*return*/, 'failed'];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Sync all pending operations
     */
    var sync = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, operations, _i, operations_1, operation, syncResult, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isSyncing.value || !isOnline.value) {
                        return [2 /*return*/, { success: 0, failed: 0, conflicts: 0, total: 0 }];
                    }
                    isSyncing.value = true;
                    error.value = null;
                    result = {
                        success: 0,
                        failed: 0,
                        conflicts: 0,
                        total: pendingOperations.value.length,
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 7, 8]);
                    operations = __spreadArray([], pendingOperations.value, true);
                    _i = 0, operations_1 = operations;
                    _b.label = 2;
                case 2:
                    if (!(_i < operations_1.length)) return [3 /*break*/, 5];
                    operation = operations_1[_i];
                    return [4 /*yield*/, syncOperation(operation)];
                case 3:
                    syncResult = _b.sent();
                    switch (syncResult) {
                        case 'synced':
                            result.success++;
                            break;
                        case 'failed':
                            result.failed++;
                            break;
                        case 'conflict':
                            result.conflicts++;
                            break;
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    // Reload queue from DB to get accurate state
                    _a = queue;
                    return [4 /*yield*/, db.getAll()];
                case 6:
                    // Reload queue from DB to get accurate state
                    _a.value = _b.sent();
                    lastSyncAt.value = new Date().toISOString();
                    console.log('[OfflineQueue] Sync completed:', result);
                    return [2 /*return*/, result];
                case 7:
                    isSyncing.value = false;
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Clear all synced operations
     */
    var clearSynced = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.deleteByStatus('synced')];
                case 1:
                    _a.sent();
                    queue.value = queue.value.filter(function (op) { return op.status !== 'synced'; });
                    console.log('[OfflineQueue] Cleared synced operations');
                    return [3 /*break*/, 3];
                case 2:
                    err_5 = _a.sent();
                    console.error('[OfflineQueue] Failed to clear synced:', err_5);
                    throw new Error(MESSAGES.DB_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Get all conflict operations
     */
    var getConflicts = function () {
        return conflictOperations.value;
    };
    /**
     * Resolve a conflict
     */
    var resolveConflict = function (id, resolution) { return __awaiter(void 0, void 0, void 0, function () {
        var operation, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    operation = queue.value.find(function (op) { return op.id === id; });
                    if (!operation || operation.status !== 'conflict') {
                        throw new Error('Không tìm thấy xung đột');
                    }
                    _a = resolution;
                    switch (_a) {
                        case 'retry': return [3 /*break*/, 1];
                        case 'discard': return [3 /*break*/, 3];
                        case 'manual': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 7];
                case 1:
                    // Reset and try again
                    operation.status = 'pending';
                    operation.retryCount = 0;
                    operation.error = undefined;
                    return [4 /*yield*/, db.update(operation)
                        // Trigger sync if online
                    ];
                case 2:
                    _c.sent();
                    // Trigger sync if online
                    if (isOnline.value) {
                        sync();
                    }
                    return [3 /*break*/, 7];
                case 3: 
                // Remove from queue
                return [4 /*yield*/, dequeue(id)];
                case 4:
                    // Remove from queue
                    _c.sent();
                    return [3 /*break*/, 7];
                case 5:
                    // Mark as synced (user handled it manually)
                    operation.status = 'synced';
                    operation.syncedAt = new Date().toISOString();
                    return [4 /*yield*/, db.update(operation)];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 7:
                    // Reload queue
                    _b = queue;
                    return [4 /*yield*/, db.getAll()];
                case 8:
                    // Reload queue
                    _b.value = _c.sent();
                    console.log("[OfflineQueue] Resolved conflict ".concat(id, " with ").concat(resolution));
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Retry a failed operation
     */
    var retryFailed = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var operation, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    operation = queue.value.find(function (op) { return op.id === id; });
                    if (!operation || operation.status !== 'failed') {
                        throw new Error('Không tìm thấy thao tác thất bại');
                    }
                    operation.status = 'pending';
                    operation.retryCount = 0;
                    operation.error = undefined;
                    return [4 /*yield*/, db.update(operation)
                        // Update local state
                    ];
                case 1:
                    _a.sent();
                    index = queue.value.findIndex(function (op) { return op.id === id; });
                    if (index !== -1) {
                        queue.value[index] = __assign({}, operation);
                    }
                    // Trigger sync if online
                    if (isOnline.value) {
                        sync();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Clear all operations
     */
    var clearAll = function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.clear()];
                case 1:
                    _a.sent();
                    queue.value = [];
                    console.log('[OfflineQueue] Cleared all operations');
                    return [3 /*break*/, 3];
                case 2:
                    err_6 = _a.sent();
                    console.error('[OfflineQueue] Failed to clear all:', err_6);
                    throw new Error(MESSAGES.DB_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Cleanup on unmount
     */
    var cleanup = function () {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
    return {
        // State
        queue: queue,
        isSyncing: isSyncing,
        lastSyncAt: lastSyncAt,
        isOnline: isOnline,
        error: error,
        isInitialized: isInitialized,
        // Getters
        pendingCount: pendingCount,
        failedCount: failedCount,
        hasConflicts: hasConflicts,
        conflictCount: conflictCount,
        pendingOperations: pendingOperations,
        failedOperations: failedOperations,
        conflictOperations: conflictOperations,
        // Actions
        initialize: initialize,
        enqueue: enqueue,
        dequeue: dequeue,
        sync: sync,
        clearSynced: clearSynced,
        getConflicts: getConflicts,
        resolveConflict: resolveConflict,
        retryFailed: retryFailed,
        clearAll: clearAll,
        cleanup: cleanup,
    };
});
