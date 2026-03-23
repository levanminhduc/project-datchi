"use strict";
/**
 * useBatchOperations Composable
 *
 * State management for batch operations (receive, transfer, issue).
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBatchOperations = useBatchOperations;
var vue_1 = require("vue");
var batchService_1 = require("@/services/batchService");
var useSnackbar_1 = require("./useSnackbar");
function useBatchOperations() {
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    // Buffer for scanned/entered cone IDs
    var coneBuffer = (0, vue_1.ref)([]);
    var transactions = (0, vue_1.ref)([]);
    var loading = (0, vue_1.ref)(false);
    var error = (0, vue_1.ref)(null);
    var lastResult = (0, vue_1.ref)(null);
    // Computed
    var bufferCount = (0, vue_1.computed)(function () { return coneBuffer.value.length; });
    var hasBuffer = (0, vue_1.computed)(function () { return coneBuffer.value.length > 0; });
    /**
     * Thêm cone vào buffer
     */
    function addToBuffer(coneId) {
        var trimmed = coneId.trim();
        if (!trimmed)
            return false;
        if (coneBuffer.value.includes(trimmed)) {
            snackbar.warning('Đã quét rồi');
            return false;
        }
        coneBuffer.value.push(trimmed);
        return true;
    }
    /**
     * Thêm nhiều cone vào buffer
     */
    function addMultipleToBuffer(coneIds) {
        var added = 0;
        for (var _i = 0, coneIds_1 = coneIds; _i < coneIds_1.length; _i++) {
            var id = coneIds_1[_i];
            if (addToBuffer(id))
                added++;
        }
        return added;
    }
    /**
     * Parse text input thành danh sách cone IDs
     */
    function parseInput(input) {
        return input
            .split(/[,\n\r]+/)
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
    }
    /**
     * Xóa cone khỏi buffer
     */
    function removeFromBuffer(coneId) {
        var index = coneBuffer.value.indexOf(coneId);
        if (index !== -1) {
            coneBuffer.value.splice(index, 1);
        }
    }
    /**
     * Xóa toàn bộ buffer
     */
    function clearBuffer() {
        coneBuffer.value = [];
    }
    /**
     * Nhập kho hàng loạt
     */
    function batchReceive(data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (coneBuffer.value.length === 0) {
                            snackbar.error('Chưa có cuộn nào để nhập');
                            return [2 /*return*/, null];
                        }
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, batchService_1.batchService.receive(__assign(__assign({}, data), { cone_ids: coneBuffer.value }))];
                    case 2:
                        result = _a.sent();
                        lastResult.value = result;
                        clearBuffer();
                        snackbar.success("\u0110\u00E3 nh\u1EADp ".concat(result.cone_count, " cu\u1ED9n v\u00E0o kho"));
                        return [2 /*return*/, result];
                    case 3:
                        err_1 = _a.sent();
                        error.value = err_1 instanceof Error ? err_1.message : 'Lỗi khi nhập kho';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Chuyển kho hàng loạt
     */
    function batchTransfer(data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, batchService_1.batchService.transfer(data)];
                    case 2:
                        result = _a.sent();
                        lastResult.value = result;
                        snackbar.success("\u0110\u00E3 chuy\u1EC3n ".concat(result.cone_count, " cu\u1ED9n"));
                        return [2 /*return*/, result];
                    case 3:
                        err_2 = _a.sent();
                        error.value = err_2 instanceof Error ? err_2.message : 'Lỗi khi chuyển kho';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Xuất kho hàng loạt
     */
    function batchIssue(data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, batchService_1.batchService.issue(data)];
                    case 2:
                        result = _a.sent();
                        lastResult.value = result;
                        snackbar.success("\u0110\u00E3 xu\u1EA5t ".concat(result.cone_count, " cu\u1ED9n cho ").concat(data.recipient));
                        return [2 /*return*/, result];
                    case 3:
                        err_3 = _a.sent();
                        error.value = err_3 instanceof Error ? err_3.message : 'Lỗi khi xuất kho';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Trả lại cuộn
     */
    function batchReturn(data) {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, batchService_1.batchService.return(data)];
                    case 2:
                        result = _a.sent();
                        lastResult.value = result;
                        snackbar.success("\u0110\u00E3 tr\u1EA3 ".concat(result.cone_count, " cu\u1ED9n"));
                        return [2 /*return*/, result];
                    case 3:
                        err_4 = _a.sent();
                        error.value = err_4 instanceof Error ? err_4.message : 'Lỗi khi trả cuộn';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Tải lịch sử thao tác
     */
    function fetchTransactions(filters) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, err_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        _a = transactions;
                        return [4 /*yield*/, batchService_1.batchService.getTransactions(filters)];
                    case 2:
                        _a.value = _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_5 = _b.sent();
                        error.value = err_5 instanceof Error ? err_5.message : 'Lỗi khi tải lịch sử';
                        snackbar.error(error.value);
                        return [3 /*break*/, 5];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Reset state
     */
    function reset() {
        coneBuffer.value = [];
        transactions.value = [];
        lastResult.value = null;
        error.value = null;
    }
    return {
        // State
        coneBuffer: coneBuffer,
        transactions: transactions,
        loading: loading,
        error: error,
        lastResult: lastResult,
        // Computed
        bufferCount: bufferCount,
        hasBuffer: hasBuffer,
        // Buffer actions
        addToBuffer: addToBuffer,
        addMultipleToBuffer: addMultipleToBuffer,
        parseInput: parseInput,
        removeFromBuffer: removeFromBuffer,
        clearBuffer: clearBuffer,
        // Batch operations
        batchReceive: batchReceive,
        batchTransfer: batchTransfer,
        batchIssue: batchIssue,
        batchReturn: batchReturn,
        // History
        fetchTransactions: fetchTransactions,
        // Utils
        reset: reset
    };
}
