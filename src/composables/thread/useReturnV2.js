"use strict";
/**
 * Thread Return V2 Composable
 * Nhap lai chi - Return Thread Cones
 *
 * Provides API calls for returning issued thread cones.
 * IMPORTANT: This composable only makes API calls and displays results.
 * All calculations are done by the backend.
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
exports.useReturnV2 = useReturnV2;
var vue_1 = require("vue");
var api_1 = require("@/services/api");
var issueV2Service_1 = require("@/services/issueV2Service");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useReturnV2() {
    var _this = this;
    // State
    var confirmedIssues = (0, vue_1.ref)([]);
    var selectedIssue = (0, vue_1.ref)(null);
    var returnLogs = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasConfirmedIssues = (0, vue_1.computed)(function () { return confirmedIssues.value.length > 0; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Load confirmed issues that have outstanding items to return
     * Calls GET /api/issues/v2?status=CONFIRMED
     */
    var loadConfirmedIssues = function () { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/issues/v2?status=CONFIRMED')];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/, response.data || { data: [], total: 0 }];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    confirmedIssues.value = result.data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1, 'Không thể tải danh sách phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReturnV2] loadConfirmedIssues error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Load issue details with lines for return
     * Calls GET /api/issues/v2/:id
     * @param issueId - Issue ID to load
     */
    var loadIssueDetails = function (issueId) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_2, errorMessage;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = selectedIssue;
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/issues/v2/".concat(issueId))];
                                    case 1:
                                        response = _a.sent();
                                        if (!response.data) {
                                            throw new Error(response.error || 'Không tìm thấy phiếu xuất');
                                        }
                                        return [2 /*return*/, response.data];
                                }
                            });
                        }); })];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2, 'Không thể tải chi tiết phiếu xuất');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReturnV2] loadIssueDetails error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Submit return for an issue
     * Calls POST /api/issues/v2/:id/return
     * @param issueId - Issue ID to return
     * @param lines - Lines with return quantities
     * @returns true on success, false on failure
     */
    var submitReturn = function (issueId, lines) { return __awaiter(_this, void 0, void 0, function () {
        var linesToSubmit, err_3, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    linesToSubmit = lines.filter(function (line) { return line.returned_full > 0 || line.returned_partial > 0; });
                    if (linesToSubmit.length === 0) {
                        snackbar.warning('Vui lòng nhập số lượng trả');
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var updatedIssue;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, issueV2Service_1.issueV2Service.returnItems(issueId, { lines: linesToSubmit })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, issueV2Service_1.issueV2Service.getById(issueId)];
                                    case 2:
                                        updatedIssue = _a.sent();
                                        selectedIssue.value = updatedIssue;
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success('Đã nhập lại thành công, cuộn trả về đã ở trạng thái khả dụng');
                    return [2 /*return*/, true];
                case 3:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3, 'Không thể nhập lại');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReturnV2] submitReturn error:', err_3);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Clear selected issue
     */
    var loadReturnLogs = function (issueId) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_4, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/issues/v2/".concat(issueId, "/return-logs"))];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/, response.data || []];
                                }
                            });
                        }); })];
                case 1:
                    result = _a.sent();
                    returnLogs.value = result;
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4, 'Không thể tải lịch sử trả kho');
                    snackbar.error(errorMessage);
                    console.error('[useReturnV2] loadReturnLogs error:', err_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var clearSelectedIssue = function () {
        selectedIssue.value = null;
    };
    /**
     * Validate return quantities locally (for UI feedback)
     * Uses total-based validation to allow cross-type returns.
     * Backend is source of truth and may convert partial returns from full cones.
     * Rule 1: returned_full <= issued_full (can't create full cones from nothing)
     * Rule 2: total_returned <= total_issued (total can't exceed total issued)
     */
    var validateReturnQuantities = function (lines, issueLines) {
        var errors = [];
        var _loop_1 = function (line) {
            var issueLine = issueLines.find(function (l) { return l.id === line.line_id; });
            if (!issueLine)
                return "continue";
            var totalReturnedFull = issueLine.returned_full + line.returned_full;
            var totalReturnedPartial = issueLine.returned_partial + line.returned_partial;
            var totalReturned = totalReturnedFull + totalReturnedPartial;
            var totalIssued = issueLine.issued_full + issueLine.issued_partial;
            // Rule 1: returned_full cannot exceed issued_full
            if (totalReturnedFull > issueLine.issued_full) {
                errors.push("".concat(issueLine.thread_name || issueLine.thread_code, ": S\u1ED1 cu\u1ED9n nguy\u00EAn tr\u1EA3 (").concat(totalReturnedFull, ") v\u01B0\u1EE3t qu\u00E1 s\u1ED1 \u0111\u00E3 xu\u1EA5t (").concat(issueLine.issued_full, ")"));
            }
            // Rule 2: total returned cannot exceed total issued
            if (totalReturned > totalIssued) {
                errors.push("".concat(issueLine.thread_name || issueLine.thread_code, ": T\u1ED5ng tr\u1EA3 (").concat(totalReturned, ") v\u01B0\u1EE3t qu\u00E1 t\u1ED5ng \u0111\u00E3 xu\u1EA5t (").concat(totalIssued, ")"));
            }
        };
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            _loop_1(line);
        }
        return {
            valid: errors.length === 0,
            errors: errors,
        };
    };
    return {
        // State
        confirmedIssues: confirmedIssues,
        selectedIssue: selectedIssue,
        returnLogs: returnLogs,
        error: error,
        // Computed
        isLoading: isLoading,
        hasConfirmedIssues: hasConfirmedIssues,
        // Actions
        loadConfirmedIssues: loadConfirmedIssues,
        loadIssueDetails: loadIssueDetails,
        loadReturnLogs: loadReturnLogs,
        submitReturn: submitReturn,
        clearError: clearError,
        clearSelectedIssue: clearSelectedIssue,
        validateReturnQuantities: validateReturnQuantities,
    };
}
