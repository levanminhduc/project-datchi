"use strict";
/**
 * Thread Service
 *
 * API client for thread type management operations.
 * Handles all HTTP operations for thread types.
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
exports.threadService = void 0;
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
    if (filters.color_id)
        params.append('color_id', String(filters.color_id));
    if (filters.material)
        params.append('material', filters.material);
    if (filters.supplier_id)
        params.append('supplier_id', String(filters.supplier_id));
    if (filters.is_active !== undefined)
        params.append('is_active', String(filters.is_active));
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.threadService = {
    /**
     * Lấy danh sách tất cả loại chỉ
     * @param filters - Optional filters for search, color, material, supplier, is_active
     * @returns Array of thread types
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/threads".concat(queryString))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Lấy thông tin loại chỉ theo ID
     * @param id - Thread type ID
     * @returns Thread type or null if not found
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/threads/".concat(id))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo loại chỉ mới
     * @param data - Thread type form data
     * @returns Created thread type
     */
    create: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/threads', {
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
     * Cập nhật thông tin loại chỉ
     * @param id - Thread type ID
     * @param data - Partial thread type data to update
     * @returns Updated thread type
     */
    update: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/threads/".concat(id), {
                            method: 'PUT',
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
     * Xóa loại chỉ (soft delete)
     * @param id - Thread type ID
     */
    remove: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/threads/".concat(id), {
                            method: 'DELETE',
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
};
