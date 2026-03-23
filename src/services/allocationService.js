"use strict";
/**
 * Allocation Service
 *
 * API client for thread allocation operations.
 * Handles soft/hard allocation, issuing, and conflict management.
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
exports.allocationService = void 0;
var api_1 = require("./api");
/**
 * Build query string from allocation filters
 */
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.order_id)
        params.append('order_id', filters.order_id);
    if (filters.thread_type_id !== undefined)
        params.append('thread_type_id', String(filters.thread_type_id));
    if (filters.status)
        params.append('status', filters.status);
    if (filters.priority)
        params.append('priority', filters.priority);
    if (filters.from_date)
        params.append('from_date', filters.from_date);
    if (filters.to_date)
        params.append('to_date', filters.to_date);
    // Request workflow filters
    if (filters.requesting_warehouse_id !== undefined)
        params.append('requesting_warehouse_id', String(filters.requesting_warehouse_id));
    if (filters.source_warehouse_id !== undefined)
        params.append('source_warehouse_id', String(filters.source_warehouse_id));
    if (filters.workflow_status)
        params.append('workflow_status', filters.workflow_status);
    if (filters.is_request)
        params.append('is_request', 'true');
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.allocationService = {
    /**
     * Lấy danh sách tất cả phân bổ với bộ lọc
     * @param filters - Optional filters for order_id, thread_type_id, status, priority, date range
     * @returns Array of allocations
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, separator, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        separator = queryString ? '&' : '?';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations".concat(queryString).concat(separator, "limit=0"))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Lấy thông tin phân bổ theo ID
     * @param id - Allocation ID
     * @returns Allocation with allocated cones
     * @throws Error if not found
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo yêu cầu phân bổ mới (trạng thái PENDING)
     * @param data - CreateAllocationDTO with order_id, thread_type_id, requested_meters, priority
     * @returns Created allocation
     */
    create: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/allocations', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể tạo phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Thực hiện phân bổ mềm - đặt chỗ cone cho đơn hàng
     * Chuyển trạng thái từ PENDING -> SOFT
     * Cone được đánh dấu SOFT_ALLOCATED
     * @param id - Allocation ID
     * @returns Updated allocation with allocated cones
     */
    execute: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/execute"), { method: 'POST' })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể thực hiện phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xuất cone đã phân bổ cho sản xuất
     * Chuyển trạng thái từ SOFT/HARD -> ISSUED
     * Cone được đánh dấu IN_PRODUCTION
     * @param id - Allocation ID
     * @returns Updated allocation
     */
    issue: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/issue"), { method: 'POST' })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể xuất phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Hủy phân bổ - giải phóng cone đã đặt chỗ
     * Chuyển trạng thái -> CANCELLED
     * Cone được trả về trạng thái AVAILABLE
     * @param id - Allocation ID
     * @returns Updated allocation
     */
    cancel: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/cancel"), { method: 'POST' })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể hủy phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy danh sách xung đột phân bổ đang hoạt động
     * Xung đột xảy ra khi tổng yêu cầu > tồn kho có sẵn
     * @returns Array of active conflicts
     */
    getConflicts: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/allocations/conflicts')];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Giải quyết xung đột bằng cách điều chỉnh ưu tiên
     * Phân bổ có ưu tiên cao hơn sẽ được xử lý trước
     * @param id - Conflict ID
     * @param newPriority - New priority to apply
     * @returns Updated conflict with resolution
     */
    resolveConflict: function (id, newPriority) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/resolve"), {
                            method: 'POST',
                            body: JSON.stringify({ priority: newPriority }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể giải quyết xung đột');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Escalate a conflict to management
     * @param conflictId - Conflict ID to escalate
     * @param notes - Optional notes for escalation
     * @returns Updated conflict
     */
    escalate: function (conflictId, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/conflicts/".concat(conflictId, "/escalate"), {
                            method: 'POST',
                            body: JSON.stringify({ notes: notes }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Không thể leo thang xung đột');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Chia nhỏ phân bổ thành hai phân bổ riêng biệt
     * Giải phóng tất cả cone đã phân bổ và đặt cả hai phân bổ về trạng thái PENDING
     * @param id - Allocation ID to split
     * @param splitMeters - Number of meters for the new allocation
     * @param reason - Optional reason for the split
     * @returns Split result with both allocations
     */
    split: function (id, splitMeters, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/split"), {
                            method: 'POST',
                            body: JSON.stringify({ split_meters: splitMeters, reason: reason }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Không thể chia nhỏ phân bổ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    // ============ REQUEST WORKFLOW METHODS ============
    /**
     * Lấy danh sách yêu cầu chỉ (có requesting_warehouse_id)
     * @param filters - Optional filters
     * @returns Array of thread requests
     */
    getRequests: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAll(__assign(__assign({}, filters), { is_request: true }))];
            });
        });
    },
    /**
     * Duyệt yêu cầu chỉ
     * Chuyển trạng thái từ PENDING -> APPROVED
     * @param id - Request ID
     * @param approvedBy - Person approving
     * @returns Updated allocation
     */
    approve: function (id, approvedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/approve"), {
                            method: 'POST',
                            body: JSON.stringify({ approved_by: approvedBy }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể duyệt yêu cầu');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Từ chối yêu cầu chỉ
     * Chuyển trạng thái từ PENDING -> REJECTED
     * @param id - Request ID
     * @param rejectedBy - Person rejecting
     * @param reason - Rejection reason
     * @returns Updated allocation
     */
    reject: function (id, rejectedBy, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/reject"), {
                            method: 'POST',
                            body: JSON.stringify({ rejected_by: rejectedBy, reason: reason }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể từ chối yêu cầu');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Đánh dấu sẵn sàng nhận
     * Chuyển trạng thái từ APPROVED -> READY_FOR_PICKUP
     * Thực hiện phân bổ mềm để đặt chỗ cone
     * @param id - Request ID
     * @returns Updated allocation with allocated cones
     */
    markReady: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/ready"), { method: 'POST' })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể đánh dấu sẵn sàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xác nhận đã nhận chỉ
     * Chuyển trạng thái từ READY_FOR_PICKUP -> RECEIVED
     * Xuất cone cho xưởng
     * @param id - Request ID
     * @param receivedBy - Person receiving
     * @returns Updated allocation
     */
    confirmReceived: function (id, receivedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/allocations/".concat(id, "/receive"), {
                            method: 'POST',
                            body: JSON.stringify({ received_by: receivedBy }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể xác nhận nhận hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
};
