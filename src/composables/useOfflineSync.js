"use strict";
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
exports.useOfflineSync = useOfflineSync;
var vue_1 = require("vue");
var useSnackbar_1 = require("./useSnackbar");
var DB_NAME = 'thread-offline-db';
var STORE_NAME = 'pending-operations';
function useOfflineSync() {
    var _this = this;
    var isOnline = (0, vue_1.ref)(navigator.onLine);
    var pendingOperations = (0, vue_1.ref)([]);
    var isSyncing = (0, vue_1.ref)(false);
    var lastSyncTime = (0, vue_1.ref)(null);
    var error = (0, vue_1.ref)(null);
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var db = null;
    // Computed
    var pendingCount = (0, vue_1.computed)(function () { return pendingOperations.value.length; });
    var hasPending = (0, vue_1.computed)(function () { return pendingCount.value > 0; });
    // Initialize IndexedDB
    var initDB = function () {
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(DB_NAME, 1);
            request.onerror = function () { return reject(request.error); };
            request.onsuccess = function () {
                db = request.result;
                resolve(db);
            };
            request.onupgradeneeded = function (event) {
                var database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    };
    // Load pending operations from IndexedDB
    var loadPending = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!db) return [3 /*break*/, 2];
                    return [4 /*yield*/, initDB()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                        var transaction = db.transaction(STORE_NAME, 'readonly');
                        var store = transaction.objectStore(STORE_NAME);
                        var request = store.getAll();
                        request.onsuccess = function () {
                            pendingOperations.value = request.result || [];
                            resolve();
                        };
                        request.onerror = function () { return reject(request.error); };
                    })];
            }
        });
    }); };
    // Add operation to queue
    var addPending = function (operation) { return __awaiter(_this, void 0, void 0, function () {
        var op;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!db) return [3 /*break*/, 2];
                    return [4 /*yield*/, initDB()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    op = __assign(__assign({}, operation), { id: "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)), timestamp: Date.now(), retries: 0 });
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var transaction = db.transaction(STORE_NAME, 'readwrite');
                            var store = transaction.objectStore(STORE_NAME);
                            var request = store.add(op);
                            request.onsuccess = function () {
                                pendingOperations.value.push(op);
                                resolve(op.id);
                            };
                            request.onerror = function () { return reject(request.error); };
                        })];
            }
        });
    }); };
    // Remove operation from queue
    var removePending = function (id) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!db) return [3 /*break*/, 2];
                    return [4 /*yield*/, initDB()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                        var transaction = db.transaction(STORE_NAME, 'readwrite');
                        var store = transaction.objectStore(STORE_NAME);
                        var request = store.delete(id);
                        request.onsuccess = function () {
                            pendingOperations.value = pendingOperations.value.filter(function (op) { return op.id !== id; });
                            resolve();
                        };
                        request.onerror = function () { return reject(request.error); };
                    })];
            }
        });
    }); };
    // Sync a single operation
    var syncOperation = function (operation) { return __awaiter(_this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, fetch(operation.endpoint, {
                            method: operation.method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(operation.data),
                        })];
                case 1:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, removePending(operation.id)];
                case 2:
                    _b.sent();
                    return [2 /*return*/, true];
                case 3:
                    // Update retry count
                    operation.retries++;
                    if (operation.retries >= 3) {
                        // Move to failed after 3 retries
                        error.value = "Kh\u00F4ng th\u1EC3 \u0111\u1ED3ng b\u1ED9: ".concat(operation.type);
                    }
                    return [2 /*return*/, false];
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Sync all pending operations
    var syncAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var sorted, successCount, failCount, _i, sorted_1, operation, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isOnline.value || isSyncing.value || !hasPending.value)
                        return [2 /*return*/];
                    isSyncing.value = true;
                    error.value = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 6, 7]);
                    sorted = __spreadArray([], pendingOperations.value, true).sort(function (a, b) { return a.timestamp - b.timestamp; });
                    successCount = 0;
                    failCount = 0;
                    _i = 0, sorted_1 = sorted;
                    _a.label = 2;
                case 2:
                    if (!(_i < sorted_1.length)) return [3 /*break*/, 5];
                    operation = sorted_1[_i];
                    return [4 /*yield*/, syncOperation(operation)];
                case 3:
                    success = _a.sent();
                    if (success) {
                        successCount++;
                    }
                    else {
                        failCount++;
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    lastSyncTime.value = new Date();
                    if (successCount > 0) {
                        snackbar.success("\u0110\u00E3 \u0111\u1ED3ng b\u1ED9 ".concat(successCount, " thao t\u00E1c"));
                    }
                    if (failCount > 0) {
                        snackbar.warning("".concat(failCount, " thao t\u00E1c ch\u01B0a th\u1EC3 \u0111\u1ED3ng b\u1ED9"));
                    }
                    return [3 /*break*/, 7];
                case 6:
                    isSyncing.value = false;
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Queue operation (online: execute immediately, offline: queue)
    var queueOperation = function (type, endpoint, method, data) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!isOnline.value) return [3 /*break*/, 6];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch(endpoint, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _b.sent();
                    return [2 /*return*/, { success: true, queued: false, result: result }];
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6: 
                // Queue for later
                return [4 /*yield*/, addPending({ type: type, endpoint: endpoint, method: method, data: data })];
                case 7:
                    // Queue for later
                    _b.sent();
                    snackbar.info('Thao tác đã lưu, sẽ đồng bộ khi có mạng');
                    return [2 /*return*/, { success: false, queued: true }];
            }
        });
    }); };
    // Online/Offline handlers
    var handleOnline = function () {
        isOnline.value = true;
        snackbar.success('Đã kết nối mạng');
        syncAll();
    };
    var handleOffline = function () {
        isOnline.value = false;
        snackbar.warning('Mất kết nối mạng - Chế độ offline');
    };
    // Clear all pending
    var clearAll = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!db) return [3 /*break*/, 2];
                    return [4 /*yield*/, initDB()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, new Promise(function (resolve, reject) {
                        var transaction = db.transaction(STORE_NAME, 'readwrite');
                        var store = transaction.objectStore(STORE_NAME);
                        var request = store.clear();
                        request.onsuccess = function () {
                            pendingOperations.value = [];
                            resolve();
                        };
                        request.onerror = function () { return reject(request.error); };
                    })];
            }
        });
    }); };
    // Lifecycle
    (0, vue_1.onMounted)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initDB()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, loadPending()];
                case 2:
                    _a.sent();
                    window.addEventListener('online', handleOnline);
                    window.addEventListener('offline', handleOffline);
                    // Try to sync on mount if online
                    if (isOnline.value && hasPending.value) {
                        syncAll();
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vue_1.onUnmounted)(function () {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    });
    return {
        // State
        isOnline: isOnline,
        pendingOperations: pendingOperations,
        pendingCount: pendingCount,
        hasPending: hasPending,
        isSyncing: isSyncing,
        lastSyncTime: lastSyncTime,
        error: error,
        // Methods
        addPending: addPending,
        removePending: removePending,
        syncAll: syncAll,
        queueOperation: queueOperation,
        clearAll: clearAll,
        loadPending: loadPending,
    };
}
