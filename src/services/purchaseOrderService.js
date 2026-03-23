"use strict";
/**
 * Purchase Order Service
 *
 * API client for purchase order operations.
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
exports.purchaseOrderService = void 0;
var api_1 = require("./api");
var BASE = '/api/purchase-orders';
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.status)
        params.append('status', filters.status);
    if (filters.priority)
        params.append('priority', filters.priority);
    if (filters.customer_name)
        params.append('customer_name', filters.customer_name);
    if (filters.po_number)
        params.append('po_number', filters.po_number);
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.purchaseOrderService = {
    /**
     * Lấy danh sách tất cả đơn hàng
     * @param filters - Optional filters
     * @returns Array of purchase orders
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var pageSize, allPurchaseOrders, page, totalCount, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageSize = 100;
                        allPurchaseOrders = [];
                        page = 1;
                        totalCount = 0;
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this.getPaginated({
                            page: page,
                            pageSize: pageSize,
                            sortBy: 'created_at',
                            descending: true,
                            status: filters === null || filters === void 0 ? void 0 : filters.status,
                            priority: filters === null || filters === void 0 ? void 0 : filters.priority,
                            customer_name: filters === null || filters === void 0 ? void 0 : filters.customer_name,
                            po_number: filters === null || filters === void 0 ? void 0 : filters.po_number,
                        })];
                    case 2:
                        result = _a.sent();
                        allPurchaseOrders.push.apply(allPurchaseOrders, result.data);
                        totalCount = result.count;
                        page += 1;
                        _a.label = 3;
                    case 3:
                        if (allPurchaseOrders.length < totalCount) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4: return [2 /*return*/, allPurchaseOrders];
                }
            });
        });
    },
    getPaginated: function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var urlParams, queryString, url, response;
            var _a;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        urlParams = new URLSearchParams();
                        if (params.page)
                            urlParams.set('page', String(params.page));
                        if (params.pageSize)
                            urlParams.set('pageSize', String(params.pageSize));
                        if (params.sortBy)
                            urlParams.set('sortBy', params.sortBy);
                        if (params.descending !== undefined)
                            urlParams.set('descending', String(params.descending));
                        if (params.status)
                            urlParams.set('status', params.status);
                        if (params.priority)
                            urlParams.set('priority', params.priority);
                        if (params.customer_name)
                            urlParams.set('customer_name', params.customer_name);
                        if (params.po_number)
                            urlParams.set('po_number', params.po_number);
                        queryString = urlParams.toString();
                        url = "".concat(BASE).concat(queryString ? "?".concat(queryString) : '');
                        return [4 /*yield*/, (0, api_1.fetchApi)(url)];
                    case 1:
                        response = _b.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, {
                                data: response.data || [],
                                count: (_a = response.count) !== null && _a !== void 0 ? _a : 0,
                            }];
                }
            });
        });
    },
    getCustomers: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/customers"))];
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
     * Lấy thông tin đơn hàng theo ID
     * @param id - Purchase order ID
     * @returns Purchase order
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
                            throw new Error('Không tìm thấy đơn hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy thông tin đơn hàng kèm po_items, styles
     * @param id - Purchase order ID
     * @returns Purchase order with items
     */
    getWithItems: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "?include=items"))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy đơn hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo đơn hàng mới
     * @param data - CreatePurchaseOrderDTO
     * @returns Created purchase order
     */
    create: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)(BASE, {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể tạo đơn hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Cập nhật đơn hàng
     * @param id - Purchase order ID
     * @param data - UpdatePurchaseOrderDTO
     * @returns Updated purchase order
     */
    update: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id), {
                            method: 'PUT',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể cập nhật đơn hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xóa đơn hàng
     * @param id - Purchase order ID
     */
    delete: function (id) {
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
    // ================== PO Items CRUD ==================
    /**
     * Thêm item vào PO
     * @param poId - Purchase order ID
     * @param data - CreatePOItemDTO
     * @returns Created item
     */
    addItem: function (poId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(poId, "/items"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể thêm mã hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Cập nhật quantity của item
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     * @param data - UpdatePOItemDTO
     * @returns Updated item
     */
    updateItem: function (poId, itemId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(poId, "/items/").concat(itemId), {
                            method: 'PUT',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể cập nhật mã hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xóa item khỏi PO (soft delete)
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     */
    deleteItem: function (poId, itemId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(poId, "/items/").concat(itemId), {
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
     * Lấy lịch sử thay đổi của item
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     * @returns Array of history entries
     */
    getItemHistory: function (poId, itemId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(poId, "/items/").concat(itemId, "/history"))];
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
};
