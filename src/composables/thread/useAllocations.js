"use strict";
/**
 * Thread Allocations Management Composable
 *
 * Provides reactive state and operations for thread allocation management.
 * Handles fetching, creating, executing, issuing, and cancelling allocations.
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
exports.useAllocations = useAllocations;
var vue_1 = require("vue");
var allocationService_1 = require("@/services/allocationService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useAllocations() {
    var _this = this;
    // State
    var allocations = (0, vue_1.ref)([]);
    var conflicts = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var selectedAllocation = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var allocationCount = (0, vue_1.computed)(function () { return allocations.value.length; });
    var conflictCount = (0, vue_1.computed)(function () { return conflicts.value.length; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all allocations from API
     * @param newFilters - Optional filters to apply
     */
    var fetchAllocations = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    allocations.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useAllocations] fetchAllocations error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch all active conflicts from API
     */
    var fetchConflicts = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.getConflicts()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 1:
                    data = _a.sent();
                    conflicts.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('[useAllocations] fetchConflicts error:', err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new allocation request
     * @param data - Allocation creation data
     */
    var createAllocation = function (data) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Tạo yêu cầu phân bổ thành công');
                    return [4 /*yield*/, fetchAllocations()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Execute soft allocation
     * @param id - Allocation ID
     */
    var executeAllocation = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.execute(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    snackbar.success('Đã thực hiện phân bổ mềm');
                    return [4 /*yield*/, fetchAllocations()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    err_4 = _a.sent();
                    snackbar.error((0, errorMessages_1.getErrorMessage)(err_4));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Issue allocation to production
     * @param id - Allocation ID
     */
    var issueAllocation = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_5;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.issue(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    snackbar.success('Đã xuất chỉ cho sản xuất');
                    return [4 /*yield*/, fetchAllocations()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    err_5 = _a.sent();
                    snackbar.error((0, errorMessages_1.getErrorMessage)(err_5));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Cancel an allocation
     * @param id - Allocation ID
     */
    var cancelAllocation = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_6;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.cancel(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    snackbar.success('Đã hủy phân bổ');
                    return [4 /*yield*/, fetchAllocations()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    err_6 = _a.sent();
                    snackbar.error((0, errorMessages_1.getErrorMessage)(err_6));
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Get allocation by ID with details
     * @param id - Allocation ID
     */
    var fetchAllocationById = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_7;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 1:
                    data = _a.sent();
                    selectedAllocation.value = data;
                    return [2 /*return*/, data];
                case 2:
                    err_7 = _a.sent();
                    snackbar.error((0, errorMessages_1.getErrorMessage)(err_7));
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        allocations: allocations,
        conflicts: conflicts,
        error: error,
        filters: filters,
        selectedAllocation: selectedAllocation,
        isLoading: isLoading,
        allocationCount: allocationCount,
        conflictCount: conflictCount,
        // Actions
        fetchAllocations: fetchAllocations,
        fetchConflicts: fetchConflicts,
        createAllocation: createAllocation,
        executeAllocation: executeAllocation,
        issueAllocation: issueAllocation,
        cancelAllocation: cancelAllocation,
        fetchAllocationById: fetchAllocationById,
    };
}
