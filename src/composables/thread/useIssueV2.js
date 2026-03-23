"use strict";
/**
 * Thread Issue V2 Composable
 * Reactive state and operations for the simplified issue management system
 *
 * Key design:
 * - Frontend only displays data and collects input
 * - All calculations (issued_equivalent, quota check, stock check) are done by backend
 * - API calls only, no frontend business logic
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
exports.useIssueV2 = useIssueV2;
var vue_1 = require("vue");
var issueV2Service_1 = require("@/services/issueV2Service");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useIssueV2() {
    var _this = this;
    // State
    var currentIssue = (0, vue_1.ref)(null);
    var issues = (0, vue_1.ref)([]);
    var formData = (0, vue_1.ref)(null);
    var validationResult = (0, vue_1.ref)(null);
    var error = (0, vue_1.ref)(null);
    var total = (0, vue_1.ref)(0);
    var filters = (0, vue_1.ref)({});
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasIssue = (0, vue_1.computed)(function () { return currentIssue.value !== null; });
    var lines = (0, vue_1.computed)(function () { var _a; return ((_a = currentIssue.value) === null || _a === void 0 ? void 0 : _a.lines) || []; });
    var threadTypes = (0, vue_1.computed)(function () { var _a; return ((_a = formData.value) === null || _a === void 0 ? void 0 : _a.thread_types) || []; });
    var isConfirmed = (0, vue_1.computed)(function () { var _a; return ((_a = currentIssue.value) === null || _a === void 0 ? void 0 : _a.status) === 'CONFIRMED'; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Clear validation result
     */
    var clearValidation = function () {
        validationResult.value = null;
    };
    /**
     * Create a new issue
     * @param data - CreateIssueV2DTO with department and created_by
     * @returns Created issue info or null on error
     */
    var createIssue = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, errorMessage;
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
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success("\u0110\u00E3 t\u1EA1o phi\u1EBFu ".concat(result.issue_code));
                    // Load the full issue with lines
                    return [4 /*yield*/, fetchIssue(result.issue_id)];
                case 3:
                    // Load the full issue with lines
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1, 'Không thể tạo phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] createIssue error:', err_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var createIssueWithFirstLine = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.createWithFirstLine(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    currentIssue.value = result;
                    snackbar.success("\u0110\u00E3 t\u1EA1o phi\u1EBFu ".concat(result.issue_code, " v\u00E0 th\u00EAm d\u00F2ng \u0111\u1EA7u ti\u00EAn"));
                    return [2 /*return*/, result];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2, 'Không thể tạo phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] createIssueWithFirstLine error:', err_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch issue by ID
     * @param id - Issue ID
     */
    var fetchIssue = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_3, errorMessage;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = currentIssue;
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3, 'Không thể tải phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] fetchIssue error:', err_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * List issues with filters
     * @param newFilters - Optional filters to apply
     */
    var fetchIssues = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_4, errorMessage;
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
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.list(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    issues.value = result.data;
                    total.value = result.total;
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4, 'Không thể tải danh sách phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] fetchIssues error:', err_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Load form data (thread types with quota and stock) for a PO/Style/Color
     * @param poId - Purchase Order ID
     * @param styleId - Style ID
     * @param colorId - Color ID
     */
    var loadFormData = function (poId, styleId, colorId) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_5, errorMessage;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    formData.value = null;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = formData;
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.getFormData(poId, styleId, colorId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.value = _b.sent();
                    return [2 /*return*/, formData.value];
                case 3:
                    err_5 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_5, 'Không thể tải dữ liệu form');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] loadFormData error:', err_5);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Validate a line (backend calculates equivalent, checks quota/stock)
     * @param data - Validate line data
     */
    var validateLine = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_6;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = validationResult;
                    return [4 /*yield*/, issueV2Service_1.issueV2Service.validateLine((_b = currentIssue.value) === null || _b === void 0 ? void 0 : _b.id, data)];
                case 1:
                    _a.value = _c.sent();
                    return [2 /*return*/, validationResult.value];
                case 2:
                    err_6 = _c.sent();
                    console.error('[useIssueV2] validateLine error:', err_6);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Add a line to the current issue
     * @param data - Add line data
     */
    var addLine = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var line, err_7, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentIssue.value) {
                        snackbar.error('Chưa tạo phiếu xuất');
                        return [2 /*return*/, null];
                    }
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.addLine(currentIssue.value.id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Refresh issue to get updated lines
                    ];
                case 2:
                    line = _a.sent();
                    // Refresh issue to get updated lines
                    return [4 /*yield*/, fetchIssue(currentIssue.value.id)];
                case 3:
                    // Refresh issue to get updated lines
                    _a.sent();
                    snackbar.success('Đã thêm dòng vào phiếu');
                    return [2 /*return*/, line];
                case 4:
                    err_7 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_7, 'Không thể thêm dòng');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] addLine error:', err_7);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Remove a line from the current issue
     * @param lineId - Line ID to remove
     */
    var removeLine = function (lineId) { return __awaiter(_this, void 0, void 0, function () {
        var err_8, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentIssue.value) {
                        snackbar.error('Chưa tạo phiếu xuất');
                        return [2 /*return*/, false];
                    }
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.removeLine(currentIssue.value.id, lineId)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                        // Refresh issue to get updated lines
                    ];
                case 2:
                    _a.sent();
                    // Refresh issue to get updated lines
                    return [4 /*yield*/, fetchIssue(currentIssue.value.id)];
                case 3:
                    // Refresh issue to get updated lines
                    _a.sent();
                    snackbar.success('Đã xóa dòng');
                    return [2 /*return*/, true];
                case 4:
                    err_8 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_8, 'Không thể xóa dòng');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] removeLine error:', err_8);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update line notes (for over quota explanation)
     * @param lineId - Line ID
     * @param notes - Notes to set
     */
    var updateLineNotes = function (lineId, notes) { return __awaiter(_this, void 0, void 0, function () {
        var err_9, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentIssue.value) {
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, issueV2Service_1.issueV2Service.updateLineNotes(currentIssue.value.id, lineId, notes)
                        // Refresh issue
                    ];
                case 2:
                    _a.sent();
                    // Refresh issue
                    return [4 /*yield*/, fetchIssue(currentIssue.value.id)];
                case 3:
                    // Refresh issue
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_9 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_9, 'Không thể cập nhật ghi chú');
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] updateLineNotes error:', err_9);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Confirm the current issue (deduct stock)
     */
    var confirmIssue = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_10, errorMessage;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!currentIssue.value) {
                        snackbar.error('Chưa tạo phiếu xuất');
                        return [2 /*return*/, false];
                    }
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = currentIssue;
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.confirm(currentIssue.value.id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.value = _b.sent();
                    snackbar.success("\u0110\u00E3 x\u00E1c nh\u1EADn phi\u1EBFu ".concat(currentIssue.value.issue_code));
                    return [2 /*return*/, true];
                case 3:
                    err_10 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_10, 'Không thể xác nhận phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useIssueV2] confirmIssue error:', err_10);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Clear current issue state
     */
    var clearIssue = function () {
        currentIssue.value = null;
        formData.value = null;
        validationResult.value = null;
        error.value = null;
    };
    return {
        // State
        currentIssue: currentIssue,
        issues: issues,
        formData: formData,
        validationResult: validationResult,
        error: error,
        total: total,
        filters: filters,
        // Computed
        isLoading: isLoading,
        hasIssue: hasIssue,
        lines: lines,
        threadTypes: threadTypes,
        isConfirmed: isConfirmed,
        // Actions
        createIssue: createIssue,
        createIssueWithFirstLine: createIssueWithFirstLine,
        fetchIssue: fetchIssue,
        fetchIssues: fetchIssues,
        loadFormData: loadFormData,
        validateLine: validateLine,
        addLine: addLine,
        removeLine: removeLine,
        updateLineNotes: updateLineNotes,
        confirmIssue: confirmIssue,
        clearIssue: clearIssue,
        clearError: clearError,
        clearValidation: clearValidation,
    };
}
