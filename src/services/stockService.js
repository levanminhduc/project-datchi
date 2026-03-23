"use strict";
/**
 * Stock Service
 *
 * API client for thread stock management operations.
 * Handles quantity-based inventory tracking with FEFO deduction.
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
exports.stockService = void 0;
var api_1 = require("./api");
/**
 * Build query string from filters object
 */
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.thread_type_id)
        params.append('thread_type_id', String(filters.thread_type_id));
    if (filters.warehouse_id)
        params.append('warehouse_id', String(filters.warehouse_id));
    if (filters.lot_number)
        params.append('lot_number', filters.lot_number);
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.stockService = {
    /**
     * Lay danh sach ton kho voi bo loc
     * @param filters - Optional filters: thread_type_id, warehouse_id, lot_number
     * @returns Array of stock records with relations
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/stock".concat(queryString))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Lay tong hop ton kho theo loai chi
     * @param warehouseId - Optional warehouse filter
     * @returns Array of stock summaries by thread type
     */
    getSummary: function (warehouseId) {
        return __awaiter(this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = warehouseId ? "?warehouse_id=".concat(warehouseId) : '';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/stock/summary".concat(params))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    addStock: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/stock', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xuat kho theo FEFO (First Expired First Out)
     * Tu dong tru tu cac lo cu nhat truoc
     * @param data - Deduction request
     * @returns Deduction result showing which lots were affected
     */
    deductStock: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/stock/deduct', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tra lai ton kho
     * Cong so luong vao stock record tuong ung
     * @param data - Return data
     * @returns Updated stock record
     */
    returnStock: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/stock/return', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lay ton kho theo loai chi cu the
     * @param threadTypeId - Thread type ID
     * @param warehouseId - Optional warehouse filter
     * @returns Array of stock records for that thread type
     */
    getByThreadType: function (threadTypeId, warehouseId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAll({
                        thread_type_id: threadTypeId,
                        warehouse_id: warehouseId,
                    })];
            });
        });
    },
    /**
     * Lay ton kho theo kho
     * @param warehouseId - Warehouse ID
     * @returns Array of stock records for that warehouse
     */
    getByWarehouse: function (warehouseId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAll({ warehouse_id: warehouseId })];
            });
        });
    },
    /**
     * Kiem tra ton kho co du khong
     * @param threadTypeId - Thread type ID
     * @param qtyFull - Required full cones
     * @param qtyPartial - Required partial cones
     * @param warehouseId - Optional warehouse filter
     * @returns true if sufficient stock available
     */
    checkAvailability: function (threadTypeId_1, qtyFull_1) {
        return __awaiter(this, arguments, void 0, function (threadTypeId, qtyFull, qtyPartial, warehouseId) {
            var stocks, totalFull, totalPartial;
            if (qtyPartial === void 0) { qtyPartial = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAll({
                            thread_type_id: threadTypeId,
                            warehouse_id: warehouseId,
                        })];
                    case 1:
                        stocks = _a.sent();
                        totalFull = stocks.reduce(function (sum, s) { return sum + (s.qty_full_cones || 0); }, 0);
                        totalPartial = stocks.reduce(function (sum, s) { return sum + (s.qty_partial_cones || 0); }, 0);
                        return [2 /*return*/, totalFull >= qtyFull && totalPartial >= qtyPartial];
                }
            });
        });
    },
};
