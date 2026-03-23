"use strict";
/**
 * Thread Requests Composable
 *
 * Provides reactive state and workflow operations for thread request management.
 * Follows patterns from useEmployees.ts
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
exports.useThreadRequests = useThreadRequests;
var vue_1 = require("vue");
var allocationService_1 = require("@/services/allocationService");
var useSnackbar_1 = require("./useSnackbar");
var useLoading_1 = require("./useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
var enums_1 = require("@/types/thread/enums");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    // Success messages
    CREATE_SUCCESS: 'Tạo yêu cầu chỉ thành công',
    APPROVE_SUCCESS: 'Đã duyệt yêu cầu',
    REJECT_SUCCESS: 'Đã từ chối yêu cầu',
    READY_SUCCESS: 'Đã chuẩn bị xong, sẵn sàng nhận',
    RECEIVE_SUCCESS: 'Đã xác nhận nhận chỉ',
    CANCEL_SUCCESS: 'Đã hủy yêu cầu',
    // Error messages (kept for fallback usage)
    FETCH_ERROR: 'Không thể tải danh sách yêu cầu',
    CREATE_ERROR: 'Tạo yêu cầu thất bại',
    APPROVE_ERROR: 'Không thể duyệt yêu cầu',
    REJECT_ERROR: 'Không thể từ chối yêu cầu',
    READY_ERROR: 'Không thể đánh dấu sẵn sàng',
    RECEIVE_ERROR: 'Không thể xác nhận nhận hàng',
    NOT_FOUND: 'Không tìm thấy yêu cầu',
};
function useThreadRequests() {
    // State
    var requests = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedRequest = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasRequests = (0, vue_1.computed)(function () { return requests.value.length > 0; });
    var requestCount = (0, vue_1.computed)(function () { return requests.value.length; });
    // Filter by status
    var pendingRequests = (0, vue_1.computed)(function () {
        return requests.value.filter(function (r) { return r.status === enums_1.AllocationStatus.PENDING; });
    });
    var approvedRequests = (0, vue_1.computed)(function () {
        return requests.value.filter(function (r) { return r.status === enums_1.AllocationStatus.APPROVED; });
    });
    var readyForPickupRequests = (0, vue_1.computed)(function () {
        return requests.value.filter(function (r) { return r.status === enums_1.AllocationStatus.READY_FOR_PICKUP; });
    });
    var receivedRequests = (0, vue_1.computed)(function () {
        return requests.value.filter(function (r) { return r.status === enums_1.AllocationStatus.RECEIVED; });
    });
    var rejectedRequests = (0, vue_1.computed)(function () {
        return requests.value.filter(function (r) { return r.status === enums_1.AllocationStatus.REJECTED; });
    });
    // Counts
    var pendingCount = (0, vue_1.computed)(function () { return pendingRequests.value.length; });
    var readyForPickupCount = (0, vue_1.computed)(function () { return readyForPickupRequests.value.length; });
    // ============ FETCH ============
    /**
     * Fetch all thread requests with optional filters
     */
    function fetchRequests(newFilters) {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (newFilters) {
                            filters.value = __assign({}, newFilters);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.getRequests(filters.value); })];
                    case 2:
                        data = _a.sent();
                        requests.value = data;
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_1, MESSAGES.FETCH_ERROR);
                        snackbar.error(error.value);
                        requests.value = [];
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Fetch single request by ID
     */
    function fetchById(id) {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.getById(id); })];
                    case 1:
                        data = _a.sent();
                        selectedRequest.value = data;
                        return [2 /*return*/, data];
                    case 2:
                        err_2 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_2, MESSAGES.NOT_FOUND);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // ============ CREATE ============
    /**
     * Create new thread request
     */
    function createRequest(data) {
        return __awaiter(this, void 0, void 0, function () {
            var created, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.create(data); })
                            // Add to local list
                        ];
                    case 1:
                        created = _a.sent();
                        // Add to local list
                        requests.value = __spreadArray([created], requests.value, true);
                        snackbar.success(MESSAGES.CREATE_SUCCESS);
                        return [2 /*return*/, created];
                    case 2:
                        err_3 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_3, MESSAGES.CREATE_ERROR);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // ============ WORKFLOW ACTIONS ============
    /**
     * Approve pending request
     */
    function approve(id, approvedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.approve(id, approvedBy); })
                            // Update local list
                        ];
                    case 1:
                        updated = _a.sent();
                        // Update local list
                        updateLocalRequest(updated);
                        snackbar.success(MESSAGES.APPROVE_SUCCESS);
                        return [2 /*return*/, updated];
                    case 2:
                        err_4 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_4, MESSAGES.APPROVE_ERROR);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Reject pending request
     */
    function reject(id, rejectedBy, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () {
                                return allocationService_1.allocationService.reject(id, rejectedBy, reason);
                            })
                            // Update local list
                        ];
                    case 1:
                        updated = _a.sent();
                        // Update local list
                        updateLocalRequest(updated);
                        snackbar.success(MESSAGES.REJECT_SUCCESS);
                        return [2 /*return*/, updated];
                    case 2:
                        err_5 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_5, MESSAGES.REJECT_ERROR);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Mark as ready for pickup (also allocates cones)
     */
    function markReady(id) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, err_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.markReady(id); })
                            // Update local list
                        ];
                    case 1:
                        updated = _a.sent();
                        // Update local list
                        updateLocalRequest(updated);
                        snackbar.success(MESSAGES.READY_SUCCESS);
                        return [2 /*return*/, updated];
                    case 2:
                        err_6 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_6, MESSAGES.READY_ERROR);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Confirm receipt at workshop
     */
    function confirmReceived(id, receivedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, err_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () {
                                return allocationService_1.allocationService.confirmReceived(id, receivedBy);
                            })
                            // Update local list
                        ];
                    case 1:
                        updated = _a.sent();
                        // Update local list
                        updateLocalRequest(updated);
                        snackbar.success(MESSAGES.RECEIVE_SUCCESS);
                        return [2 /*return*/, updated];
                    case 2:
                        err_7 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_7, MESSAGES.RECEIVE_ERROR);
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Cancel request
     */
    function cancelRequest(id) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, err_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        error.value = null;
                        return [4 /*yield*/, loading.withLoading(function () { return allocationService_1.allocationService.cancel(id); })
                            // Update local list
                        ];
                    case 1:
                        updated = _a.sent();
                        // Update local list
                        updateLocalRequest(updated);
                        snackbar.success(MESSAGES.CANCEL_SUCCESS);
                        return [2 /*return*/, updated];
                    case 2:
                        err_8 = _a.sent();
                        error.value = (0, errorMessages_1.getErrorMessage)(err_8, 'Không thể hủy yêu cầu');
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // ============ HELPERS ============
    /**
     * Update a request in the local list
     */
    function updateLocalRequest(updated) {
        var _a;
        var index = requests.value.findIndex(function (r) { return r.id === updated.id; });
        if (index !== -1) {
            requests.value[index] = updated;
        }
        if (((_a = selectedRequest.value) === null || _a === void 0 ? void 0 : _a.id) === updated.id) {
            selectedRequest.value = updated;
        }
    }
    /**
     * Clear all state
     */
    function reset() {
        requests.value = [];
        error.value = null;
        selectedRequest.value = null;
        filters.value = {};
    }
    return {
        // State
        requests: requests,
        error: error,
        selectedRequest: selectedRequest,
        filters: filters,
        // Computed
        isLoading: isLoading,
        hasRequests: hasRequests,
        requestCount: requestCount,
        pendingRequests: pendingRequests,
        approvedRequests: approvedRequests,
        readyForPickupRequests: readyForPickupRequests,
        receivedRequests: receivedRequests,
        rejectedRequests: rejectedRequests,
        pendingCount: pendingCount,
        readyForPickupCount: readyForPickupCount,
        // Actions
        fetchRequests: fetchRequests,
        fetchById: fetchById,
        createRequest: createRequest,
        approve: approve,
        reject: reject,
        markReady: markReady,
        confirmReceived: confirmReceived,
        cancelRequest: cancelRequest,
        reset: reset,
    };
}
