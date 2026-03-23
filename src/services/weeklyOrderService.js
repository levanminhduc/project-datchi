"use strict";
/**
 * Weekly Order Service
 *
 * API client for weekly thread ordering operations.
 * Handles CRUD for weekly orders and calculation results.
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
exports.weeklyOrderService = void 0;
var api_1 = require("./api");
var BASE = '/api/weekly-orders';
exports.weeklyOrderService = {
    /**
     * Kiểm tra tên tuần đã tồn tại chưa
     * @param name - Tên tuần cần kiểm tra
     * @returns { exists: boolean, week?: { id, week_name, status } }
     */
    checkWeekNameExists: function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmed, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trimmed = name.trim();
                        if (!trimmed) {
                            return [2 /*return*/, { exists: false }];
                        }
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/check-name?name=").concat(encodeURIComponent(trimmed)))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || { exists: false }];
                }
            });
        });
    },
    /**
     * Lấy danh sách tất cả tuần đặt hàng
     * @param params - Optional filters (status)
     * @returns Array of weekly orders
     */
    getAll: function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var searchParams, queryString, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        if (params === null || params === void 0 ? void 0 : params.status)
                            searchParams.append('status', params.status);
                        queryString = searchParams.toString();
                        url = queryString ? "".concat(BASE, "?").concat(queryString) : BASE;
                        return [4 /*yield*/, (0, api_1.fetchApi)(url)];
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
     * Lấy thông tin tuần đặt hàng theo ID
     * @param id - Weekly order ID
     * @returns Weekly order with items
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy tuần đặt hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo tuần đặt hàng mới với danh sách items
     * @param dto - CreateWeeklyOrderDTO with week_name and items
     * @returns Created weekly order
     */
    create: function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)(BASE, {
                            method: 'POST',
                            body: JSON.stringify(dto),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể tạo tuần đặt hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Cập nhật tuần đặt hàng
     * @param id - Weekly order ID
     * @param dto - UpdateWeeklyOrderDTO with fields to update
     * @returns Updated weekly order
     */
    update: function (id, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id), {
                            method: 'PUT',
                            body: JSON.stringify(dto),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể cập nhật tuần đặt hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xóa tuần đặt hàng
     * @param id - Weekly order ID
     */
    remove: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id), {
                            method: 'DELETE',
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Cập nhật trạng thái tuần đặt hàng (draft -> confirmed -> cancelled)
     * @param id - Weekly order ID
     * @param status - New status
     * @returns Updated weekly order
     */
    updateStatus: function (id, status) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "/status"), {
                            method: 'PATCH',
                            body: JSON.stringify({ status: status }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể cập nhật trạng thái');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lưu kết quả tính toán định mức cho tuần đặt hàng
     * @param id - Weekly order ID
     * @param data - Calculation and summary data
     * @returns Saved results
     */
    saveResults: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "/results"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể lưu kết quả tính toán');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy kết quả tính toán định mức đã lưu
     * @param id - Weekly order ID
     * @returns Calculation results
     */
    getResults: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "/results"))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy kết quả tính toán');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    enrichInventory: function (rows, currentWeekId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/enrich-inventory"), {
                            method: 'POST',
                            body: JSON.stringify({ summary_rows: rows, current_week_id: currentWeekId }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || rows];
                }
            });
        });
    },
    /**
     * Cập nhật định mức (quota_cones) cho một loại chỉ
     * @param weekId - Weekly order ID
     * @param threadTypeId - Thread type ID
     * @param quotaCones - New quota value
     */
    updateQuotaCones: function (weekId, threadTypeId, quotaCones) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/items/").concat(weekId, "/quota"), {
                            method: 'PUT',
                            body: JSON.stringify({ thread_type_id: threadTypeId, quota_cones: quotaCones }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    getOrderedQuantities: function (pairs, excludeWeekId) {
        return __awaiter(this, void 0, void 0, function () {
            var searchParams, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        searchParams.append('po_style_pairs', JSON.stringify(pairs));
                        if (excludeWeekId)
                            searchParams.append('exclude_week_id', String(excludeWeekId));
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/ordered-quantities?").concat(searchParams.toString()))];
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
    getHistoryByWeek: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var searchParams, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        if (filters.po_id)
                            searchParams.append('po_id', String(filters.po_id));
                        if (filters.style_id)
                            searchParams.append('style_id', String(filters.style_id));
                        if (filters.from_date)
                            searchParams.append('from_date', filters.from_date);
                        if (filters.to_date)
                            searchParams.append('to_date', filters.to_date);
                        if (filters.status)
                            searchParams.append('status', filters.status);
                        if (filters.created_by)
                            searchParams.append('created_by', filters.created_by);
                        if (filters.page)
                            searchParams.append('page', String(filters.page));
                        if (filters.limit)
                            searchParams.append('limit', String(filters.limit));
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/history-by-week?").concat(searchParams.toString()))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, {
                                data: response.data || [],
                                pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
                            }];
                }
            });
        });
    },
    createLoan: function (toWeekId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(toWeekId, "/loans"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể tạo khoản mượn chỉ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    createBatchLoan: function (toWeekId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(toWeekId, "/loans/batch"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể tạo khoản mượn chỉ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    getLoans: function (weekId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/loans"))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || { all: [], given: [], received: [] }];
                }
            });
        });
    },
    getReservations: function (weekId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/reservations"))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || { cones: [], summary: [], total_cones: 0 }];
                }
            });
        });
    },
    /**
     * Get all loans across all weeks
     */
    getAllLoans: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/loans/all"))];
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
    getLoanSummary: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/loans/summary"))];
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
     * Task 6.2: Get reservation summary for a week
     * Returns per-thread summary with needed, reserved, shortage, available_stock
     */
    getReservationSummary: function (weekId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/reservation-summary"))];
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
     * Task 6.1: Reserve available stock for a confirmed week
     * Creates loan record with from_week_id = NULL
     */
    reserveFromStock: function (weekId, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/reserve-from-stock"), {
                            method: 'POST',
                            body: JSON.stringify(dto),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể lấy từ tồn kho');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    getAssignmentSummary: function (status) {
        return __awaiter(this, void 0, void 0, function () {
            var params, queryString, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (status)
                            params.append('status', status);
                        queryString = params.toString();
                        url = queryString ? "".concat(BASE, "/assignment-summary?").concat(queryString) : "".concat(BASE, "/assignment-summary");
                        return [4 /*yield*/, (0, api_1.fetchApi)(url)];
                    case 1:
                        response = _a.sent();
                        if (response.error)
                            throw new Error(response.error);
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    getLoanDetailByType: function (weekId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/loan-detail-by-type"))];
                    case 1:
                        response = _a.sent();
                        if (response.error)
                            throw new Error(response.error);
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    getReturnLogs: function (loanId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/loans/").concat(loanId, "/return-logs"))];
                    case 1:
                        response = _a.sent();
                        if (response.error)
                            throw new Error(response.error);
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    manualReturn: function (weekId, loanId, dto) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(weekId, "/loans/").concat(loanId, "/manual-return"), { method: 'POST', body: JSON.stringify(dto) })];
                    case 1:
                        response = _a.sent();
                        if (response.error)
                            throw new Error(response.error);
                        if (!response.data)
                            throw new Error('Không thể trả chỉ');
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
};
