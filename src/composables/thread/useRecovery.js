"use strict";
/**
 * Thread Recovery Management Composable
 *
 * Provides reactive state and operations for cone recovery management.
 * Handles fetching, initiating returns, weighing, confirming, and writing off.
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
exports.useRecovery = useRecovery;
var vue_1 = require("vue");
var recoveryService_1 = require("@/services/recoveryService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
var enums_1 = require("@/types/thread/enums");
/**
 * Vietnamese messages for recovery operations
 */
var MESSAGES = {
    // Success messages
    INITIATE_SUCCESS: 'Khởi tạo hoàn trả thành công',
    WEIGH_SUCCESS: 'Đã cân và tính toán số mét còn lại',
    CONFIRM_SUCCESS: 'Xác nhận hoàn trả thành công',
    WRITEOFF_SUCCESS: 'Đã loại bỏ cuộn chỉ',
    // Error messages
    FETCH_ERROR: 'Không thể tải danh sách hoàn trả',
    INITIATE_ERROR: 'Khởi tạo hoàn trả thất bại',
    WEIGH_ERROR: 'Cân cuộn chỉ thất bại',
    CONFIRM_ERROR: 'Xác nhận hoàn trả thất bại',
    WRITEOFF_ERROR: 'Loại bỏ cuộn chỉ thất bại',
};
function useRecovery() {
    var _this = this;
    // State
    var recoveries = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedRecovery = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasRecoveries = (0, vue_1.computed)(function () { return recoveries.value.length > 0; });
    var pendingWeighCount = (0, vue_1.computed)(function () {
        return recoveries.value.filter(function (r) { return r.status === enums_1.RecoveryStatus.PENDING_WEIGH; }).length;
    });
    var recoveryCount = (0, vue_1.computed)(function () { return recoveries.value.length; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all recovery records from API
     * @param newFilters - Optional filters to apply
     */
    var fetchRecoveries = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    if (newFilters) {
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    recoveries.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.FETCH_ERROR);
                    console.error('[useRecovery] fetchRecoveries error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch a single recovery by ID
     * @param id - Recovery ID
     */
    var fetchRecoveryById = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 1:
                    data = _a.sent();
                    selectedRecovery.value = data;
                    return [2 /*return*/, data];
                case 2:
                    err_2 = _a.sent();
                    snackbar.error((0, errorMessages_1.getErrorMessage)(err_2));
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Initiate a return from barcode scan
     * @param data - InitiateReturnDTO with cone_id (barcode), returned_by, notes
     */
    var initiateReturn = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_3, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.initiate(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success(MESSAGES.INITIATE_SUCCESS);
                    return [4 /*yield*/, fetchRecoveries()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error("".concat(MESSAGES.INITIATE_ERROR, ": ").concat(errorMessage));
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Record weight for a cone and calculate remaining meters
     * @param id - Recovery ID
     * @param data - WeighConeDTO with weight_grams
     */
    var weighCone = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_4, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.weigh(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success(MESSAGES.WEIGH_SUCCESS);
                    return [4 /*yield*/, fetchRecoveries()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4);
                    error.value = errorMessage;
                    snackbar.error("".concat(MESSAGES.WEIGH_ERROR, ": ").concat(errorMessage));
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Confirm recovery and return cone to inventory
     * @param id - Recovery ID
     * @param confirmedBy - Optional confirmer name
     */
    var confirmRecovery = function (id, confirmedBy) { return __awaiter(_this, void 0, void 0, function () {
        var err_5;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.confirm(id, confirmedBy)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    snackbar.success(MESSAGES.CONFIRM_SUCCESS);
                    return [4 /*yield*/, fetchRecoveries()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    err_5 = _a.sent();
                    snackbar.error("".concat(MESSAGES.CONFIRM_ERROR, ": ").concat((0, errorMessages_1.getErrorMessage)(err_5)));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Write off a cone (mark as unsuitable for use)
     * @param id - Recovery ID
     * @param data - WriteOffDTO with reason and approved_by
     */
    var writeOffCone = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var err_6;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, recoveryService_1.recoveryService.writeOff(id, data)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    snackbar.success(MESSAGES.WRITEOFF_SUCCESS);
                    return [4 /*yield*/, fetchRecoveries()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    err_6 = _a.sent();
                    snackbar.error("".concat(MESSAGES.WRITEOFF_ERROR, ": ").concat((0, errorMessages_1.getErrorMessage)(err_6)));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch pending weigh recoveries (shortcut)
     */
    var fetchPending = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchRecoveries({ status: enums_1.RecoveryStatus.PENDING_WEIGH })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        recoveries: recoveries,
        error: error,
        selectedRecovery: selectedRecovery,
        filters: filters,
        // Computed
        isLoading: isLoading,
        hasRecoveries: hasRecoveries,
        pendingWeighCount: pendingWeighCount,
        recoveryCount: recoveryCount,
        // Actions
        fetchRecoveries: fetchRecoveries,
        fetchRecoveryById: fetchRecoveryById,
        initiateReturn: initiateReturn,
        weighCone: weighCone,
        confirmRecovery: confirmRecovery,
        writeOffCone: writeOffCone,
        fetchPending: fetchPending,
        clearError: clearError,
    };
}
