"use strict";
/**
 * Style Service
 *
 * API client for style operations.
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
exports.styleService = void 0;
var api_1 = require("./api");
var BASE = '/api/styles';
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.style_code)
        params.append('style_code', filters.style_code);
    if (filters.style_name)
        params.append('style_name', filters.style_name);
    if (filters.fabric_type)
        params.append('fabric_type', filters.fabric_type);
    if (filters.sub_art_code)
        params.append('sub_art_code', filters.sub_art_code);
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.styleService = {
    /**
     * Search styles với server-side filtering
     * @param params - Search parameters
     * @returns Array of matching styles
     */
    search: function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var queryParts, queryString, response;
            var _a;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryParts = [];
                        if ((_a = params.search) === null || _a === void 0 ? void 0 : _a.trim()) {
                            queryParts.push("search=".concat(encodeURIComponent(params.search.trim())));
                        }
                        if (params.limit && params.limit > 0) {
                            queryParts.push("limit=".concat(Math.min(params.limit, 100)));
                        }
                        if (params.excludeIds && params.excludeIds.length > 0) {
                            queryParts.push("exclude_ids=".concat(params.excludeIds.join(',')));
                        }
                        queryString = queryParts.length > 0 ? "?".concat(queryParts.join('&')) : '';
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE).concat(queryString))];
                    case 1:
                        response = _b.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Lấy danh sách tất cả mã hàng
     * @param filters - Optional filters
     * @returns Array of styles
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE).concat(queryString))];
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
     * Lấy thông tin mã hàng theo ID
     * @param id - Style ID
     * @returns Style
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
                            throw new Error('Không tìm thấy mã hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo mã hàng mới
     * @param data - CreateStyleDTO
     * @returns Created style
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
                            throw new Error('Không thể tạo mã hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Cập nhật mã hàng
     * @param id - Style ID
     * @param data - UpdateStyleDTO
     * @returns Updated style
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
                            throw new Error('Không thể cập nhật mã hàng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xóa mã hàng
     * @param id - Style ID
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
    /**
     * Lấy định mức chỉ của mã hàng
     * @param id - Style ID
     * @returns Array of style thread specs
     */
    getThreadSpecs: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "/thread-specs"))];
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
     * Lấy danh sách màu có định mức chỉ của mã hàng
     * @param id - Style ID
     * @returns Array of colors with thread specs configured
     */
    getSpecColors: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id, "/spec-colors"))];
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
