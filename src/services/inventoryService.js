"use strict";
/**
 * Inventory Service
 *
 * API client for thread inventory management operations.
 * Handles all HTTP operations for cone inventory.
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
exports.inventoryService = void 0;
var api_1 = require("./api");
/**
 * Build query string from filters object
 */
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.search)
        params.append('search', filters.search);
    if (filters.thread_type_id != null)
        params.append('thread_type_id', String(filters.thread_type_id));
    if (filters.warehouse_id != null)
        params.append('warehouse_id', String(filters.warehouse_id));
    if (filters.status)
        params.append('status', filters.status);
    if (filters.is_partial !== undefined)
        params.append('is_partial', String(filters.is_partial));
    if (filters.expiry_before)
        params.append('expiry_before', filters.expiry_before);
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.inventoryService = {
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
                            urlParams.append('page', String(params.page));
                        if (params.pageSize)
                            urlParams.append('pageSize', String(params.pageSize));
                        if (params.search)
                            urlParams.append('search', params.search);
                        if (params.thread_type_id != null)
                            urlParams.append('thread_type_id', String(params.thread_type_id));
                        if (params.warehouse_id != null)
                            urlParams.append('warehouse_id', String(params.warehouse_id));
                        if (params.status)
                            urlParams.append('status', params.status);
                        if (params.is_partial !== undefined)
                            urlParams.append('is_partial', String(params.is_partial));
                        if (params.sortBy)
                            urlParams.append('sortBy', params.sortBy);
                        if (params.descending !== undefined)
                            urlParams.append('descending', String(params.descending));
                        queryString = urlParams.toString();
                        url = "/api/inventory".concat(queryString ? "?".concat(queryString) : '');
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
    /**
     * Lấy danh sách tất cả cone trong kho
     * Uses limit=0 to trigger batch fetch for all records
     * @param filters - Optional filters for search, thread_type_id, warehouse_id, status, is_partial
     * @returns Array of cones
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, separator, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        separator = queryString ? '&' : '?';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory".concat(queryString).concat(separator, "limit=0"))];
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
     * Lấy thông tin cone theo ID
     * @param id - Cone ID (database ID)
     * @returns Cone
     * @throws Error if not found
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/".concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy cuộn chỉ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy thông tin cone theo mã vạch (cone_id)
     * @param coneId - Barcode/cone_id string
     * @returns Cone
     * @throws Error if not found
     */
    getByBarcode: function (coneId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/by-barcode/".concat(encodeURIComponent(coneId)))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy cuộn chỉ với mã vạch này');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy tất cả cone trong một kho cụ thể (cho kiểm kê)
     * @param warehouseId - Warehouse ID
     * @returns ApiResponse with array of partial cone data
     */
    getByWarehouse: function (warehouseId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/by-warehouse/".concat(warehouseId))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    },
    /**
     * Lấy tổng hợp số lượng có sẵn theo thread type
     * @param threadTypeId - Optional filter by thread type ID
     * @returns Record mapping thread_type_id to summary (total_meters, full_cones, partial_cones)
     */
    getAvailableSummary: function (threadTypeId) {
        return __awaiter(this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = threadTypeId !== undefined ? "?thread_type_id=".concat(threadTypeId) : '';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/available/summary".concat(params))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || {}];
                }
            });
        });
    },
    /**
     * Nhập kho mới - tạo nhiều cone cùng lúc
     * @param data - ReceiveStockDTO with thread_type_id, warehouse_id, quantity_cones, etc.
     * @returns Array of created cones
     */
    receiveStock: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/inventory/receive', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
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
     * Lưu kết quả kiểm kê
     * @param warehouseId - Warehouse ID
     * @param scannedConeIds - Array of scanned cone IDs
     * @param notes - Optional notes
     * @returns Stocktake result with comparison data
     */
    saveStocktake: function (warehouseId, scannedConeIds, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/inventory/stocktake', {
                            method: 'POST',
                            body: JSON.stringify({
                                warehouse_id: warehouseId,
                                scanned_cone_ids: scannedConeIds,
                                notes: notes,
                            }),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    },
    /**
     * Lấy tổng hợp tồn kho theo cuộn (cone-based summary)
     * Groups by thread_type, counts full and partial cones
     * @param filters - Optional filters: warehouse_id, supplier_id, material, search
     * @returns Array of ConeSummaryRow
     */
    getConeSummary: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var params, queryString, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if ((filters === null || filters === void 0 ? void 0 : filters.warehouse_id) != null)
                            params.append('warehouse_id', String(filters.warehouse_id));
                        if ((filters === null || filters === void 0 ? void 0 : filters.supplier_id) != null)
                            params.append('supplier_id', String(filters.supplier_id));
                        if (filters === null || filters === void 0 ? void 0 : filters.material)
                            params.append('material', filters.material);
                        if (filters === null || filters === void 0 ? void 0 : filters.search)
                            params.append('search', filters.search);
                        queryString = params.toString();
                        url = "/api/inventory/summary/by-cone".concat(queryString ? "?".concat(queryString) : '');
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
     * Lấy chi tiết phân bố kho cho một loại chỉ cụ thể
     * Shows breakdown by warehouse for drill-down view
     * @param threadTypeId - Thread type ID
     * @returns Array of ConeWarehouseBreakdown
     */
    getWarehouseBreakdown: function (threadTypeId, colorId) {
        return __awaiter(this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = colorId != null ? "?color_id=".concat(colorId) : '';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/summary/by-cone/".concat(threadTypeId, "/warehouses").concat(params))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, {
                                data: response.data || [],
                                supplier_breakdown: response.supplier_breakdown || []
                            }];
                }
            });
        });
    },
    getUnassignedByThreadType: function (warehouseId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/inventory/unassigned-by-thread-type?warehouse_id=".concat(warehouseId))];
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
