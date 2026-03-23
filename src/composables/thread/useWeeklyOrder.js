"use strict";
/**
 * Weekly Order Composable
 *
 * Provides reactive state and CRUD operations for weekly thread orders.
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
exports.useWeeklyOrder = useWeeklyOrder;
var vue_1 = require("vue");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useSnackbar_1 = require("../useSnackbar");
var useConfirm_1 = require("../useConfirm");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
var MESSAGES = {
    CREATE_SUCCESS: 'Tạo tuần đặt hàng thành công',
    UPDATE_SUCCESS: 'Cập nhật tuần đặt hàng thành công',
    DELETE_SUCCESS: 'Xóa tuần đặt hàng thành công',
    SAVE_RESULTS_SUCCESS: 'Lưu kết quả tính toán thành công',
};
var getErrorMessage = (0, errorMessages_1.createErrorHandler)({
    duplicate: 'Tên tuần đã tồn tại',
    notFound: 'Không tìm thấy tuần đặt hàng',
    validation: 'Dữ liệu không hợp lệ',
});
function useWeeklyOrder() {
    var _this = this;
    // State
    var weeks = (0, vue_1.ref)([]);
    var selectedWeek = (0, vue_1.ref)(null);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var confirm = (0, useConfirm_1.useConfirm)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all weeks from API
     */
    var fetchWeeks = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getAll()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    weeks.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = getErrorMessage(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] fetchWeeks error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new weekly order
     */
    var createWeek = function (dto) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.create(dto)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success(MESSAGES.CREATE_SUCCESS);
                    return [4 /*yield*/, fetchWeeks()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_2 = _a.sent();
                    errorMessage = getErrorMessage(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] createWeek error:', err_2);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update an existing weekly order
     */
    var updateWeek = function (id, dto) { return __awaiter(_this, void 0, void 0, function () {
        var result_1, err_3, errorMessage;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.update(id, dto)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Update local state
                    ];
                case 2:
                    result_1 = _b.sent();
                    // Update local state
                    weeks.value = weeks.value.map(function (w) { return (w.id === id ? result_1 : w); });
                    if (((_a = selectedWeek.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedWeek.value = result_1;
                    }
                    snackbar.success(MESSAGES.UPDATE_SUCCESS);
                    return [2 /*return*/, result_1];
                case 3:
                    err_3 = _b.sent();
                    errorMessage = getErrorMessage(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] updateWeek error:', err_3);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete a weekly order after confirmation
     */
    var deleteWeek = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var week, weekName, confirmed, err_4, errorMessage;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    week = weeks.value.find(function (w) { return w.id === id; });
                    weekName = (week === null || week === void 0 ? void 0 : week.week_name) || "#".concat(id);
                    return [4 /*yield*/, confirm.confirmDelete({
                            itemName: weekName,
                            title: 'Xác nhận xóa tuần đặt hàng',
                            message: "B\u1EA1n c\u00F3 ch\u1EAFc ch\u1EAFn mu\u1ED1n x\u00F3a \"".concat(weekName, "\"? T\u1EA5t c\u1EA3 d\u1EEF li\u1EC7u items v\u00E0 k\u1EBFt qu\u1EA3 t\u00EDnh to\u00E1n s\u1EBD b\u1ECB x\u00F3a."),
                        })];
                case 1:
                    confirmed = _b.sent();
                    if (!confirmed)
                        return [2 /*return*/, false];
                    clearError();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.remove(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _b.sent();
                    weeks.value = weeks.value.filter(function (w) { return w.id !== id; });
                    if (((_a = selectedWeek.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedWeek.value = null;
                    }
                    snackbar.success(MESSAGES.DELETE_SUCCESS);
                    return [2 /*return*/, true];
                case 4:
                    err_4 = _b.sent();
                    errorMessage = getErrorMessage(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] deleteWeek error:', err_4);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Load a single week with its items
     */
    var loadWeek = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_5, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    selectedWeek.value = data;
                    return [2 /*return*/, data];
                case 3:
                    err_5 = _a.sent();
                    errorMessage = getErrorMessage(err_5);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] loadWeek error:', err_5);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Save calculation results for a weekly order
     */
    var saveResults = function (weekId, calculationData, summaryData) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_6, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.saveResults(weekId, {
                                            calculation_data: calculationData,
                                            summary_data: summaryData,
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success(MESSAGES.SAVE_RESULTS_SUCCESS);
                    return [2 /*return*/, result];
                case 3:
                    err_6 = _a.sent();
                    errorMessage = getErrorMessage(err_6);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] saveResults error:', err_6);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Load saved calculation results for a weekly order
     */
    var loadResults = function (weekId) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_7, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getResults(weekId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    err_7 = _a.sent();
                    errorMessage = getErrorMessage(err_7);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] loadResults error:', err_7);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a loan (borrow thread from another week)
     */
    var createLoan = function (toWeekId, dto) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_8, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.createLoan(toWeekId, dto)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Mượn chỉ thành công');
                    return [2 /*return*/, result];
                case 3:
                    err_8 = _a.sent();
                    errorMessage = getErrorMessage(err_8);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] createLoan error:', err_8);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch loan history for a week (given and received)
     */
    var fetchLoans = function (weekId) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_9, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getLoans(weekId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 3:
                    err_9 = _a.sent();
                    errorMessage = getErrorMessage(err_9);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWeeklyOrder] fetchLoans error:', err_9);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        weeks: weeks,
        selectedWeek: selectedWeek,
        loading: isLoading,
        error: error,
        // Actions
        clearError: clearError,
        fetchWeeks: fetchWeeks,
        createWeek: createWeek,
        updateWeek: updateWeek,
        deleteWeek: deleteWeek,
        loadWeek: loadWeek,
        saveResults: saveResults,
        loadResults: loadResults,
        createLoan: createLoan,
        fetchLoans: fetchLoans,
    };
}
