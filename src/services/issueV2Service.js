"use strict";
/**
 * Issue V2 Service
 * API client for simplified issue management (quantity-based tracking)
 *
 * Uses fetchApi for consistent error handling.
 * All business logic is handled by the backend; this service only makes API calls.
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
exports.issueV2Service = void 0;
var api_1 = require("./api");
var BASE = '/api/issues/v2';
function convertDateFormat(dateStr) {
    if (!dateStr)
        return '';
    var parts = dateStr.split('/');
    if (parts.length === 3) {
        return "".concat(parts[2], "-").concat(parts[1], "-").concat(parts[0]);
    }
    return dateStr;
}
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.department)
        params.append('department', filters.department);
    if (filters.status)
        params.append('status', filters.status);
    if (filters.from)
        params.append('from', convertDateFormat(filters.from));
    if (filters.to)
        params.append('to', convertDateFormat(filters.to));
    if (filters.page)
        params.append('page', String(filters.page));
    if (filters.limit)
        params.append('limit', String(filters.limit));
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.issueV2Service = {
    /**
     * Tao phieu xuat moi (Create new issue)
     * @param data - CreateIssueV2DTO with department, created_by
     * @returns Created issue ID and code
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
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the tao phieu xuat');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    createWithFirstLine: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/create-with-lines"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Không thể tạo phiếu xuất');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lay chi tiet phieu xuat (Get issue by ID with lines)
     * @param id - Issue ID
     * @returns Issue with all lines including computed fields
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong tim thay phieu xuat');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lay danh sach phieu xuat (List issues with filters)
     * @param filters - Optional filters
     * @returns Paginated list of issues
     */
    list: function (filters) {
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
                        return [2 /*return*/, response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }];
                }
            });
        });
    },
    /**
     * Lay danh sach options cho cascading dropdown (PO -> Style -> Color)
     * Chi tra ve cac PO/Style/Color tu don hang tuan da xac nhan
     * @param poId - Optional: filter styles by PO
     * @param styleId - Optional: filter colors by style (requires poId)
     * @returns Array of PO options, Style options, or Color options
     */
    getOrderOptions: function (poId, styleId) {
        return __awaiter(this, void 0, void 0, function () {
            var params, queryString, url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (poId)
                            params.append('po_id', String(poId));
                        if (styleId)
                            params.append('style_id', String(styleId));
                        queryString = params.toString();
                        url = queryString ? "".concat(BASE, "/order-options?").concat(queryString) : "".concat(BASE, "/order-options");
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
     * Lay du lieu form (Load thread types with quota & stock for a PO/Style/Color)
     * @param poId - Purchase Order ID
     * @param styleId - Style ID
     * @param colorId - Color ID
     * @returns Thread types with quota and stock info
     */
    getFormData: function (poId, styleId, colorId) {
        return __awaiter(this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams({
                            po_id: String(poId),
                            style_id: String(styleId),
                            style_color_id: String(colorId),
                        });
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/form-data?").concat(params))];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the tai du lieu form');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Them dong vao phieu xuat (Add line to issue)
     * @param issueId - Issue ID
     * @param data - AddIssueLineV2DTO
     * @returns Added line with computed fields
     */
    addLine: function (issueId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(issueId, "/lines"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the them dong');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Kiem tra dong truoc khi them (Validate line before adding)
     * Backend computes issued_equivalent, checks quota/stock
     * @param issueId - Issue ID
     * @param data - ValidateIssueLineV2DTO
     * @returns Validation result with computed fields
     */
    validateLine: function (issueId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = issueId ? "".concat(BASE, "/").concat(issueId, "/lines/validate") : "".concat(BASE, "/validate-line");
                        return [4 /*yield*/, (0, api_1.fetchApi)(url, {
                                method: 'POST',
                                body: JSON.stringify(data),
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the kiem tra dong');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xac nhan phieu xuat (Confirm issue and deduct stock)
     * @param issueId - Issue ID
     * @param idempotencyKey - UUID for idempotent request
     * @returns Updated issue with CONFIRMED status
     */
    confirm: function (issueId, idempotencyKey) {
        return __awaiter(this, void 0, void 0, function () {
            var key, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = idempotencyKey || crypto.randomUUID();
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(issueId, "/confirm"), {
                                method: 'POST',
                                body: JSON.stringify({ idempotency_key: key }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the xac nhan phieu xuat');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xoa dong khoi phieu xuat (Remove line from issue)
     * @param issueId - Issue ID
     * @param lineId - Line ID
     */
    removeLine: function (issueId, lineId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(issueId, "/lines/").concat(lineId), {
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
    deleteIssue: function (id) {
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
     * Cap nhat ghi chu dong (Update line notes)
     * @param issueId - Issue ID
     * @param lineId - Line ID
     * @param notes - Over quota notes
     * @returns Updated line
     */
    updateLineNotes: function (issueId, lineId, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(issueId, "/lines/").concat(lineId), {
                            method: 'PATCH',
                            body: JSON.stringify({ over_quota_notes: notes }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the cap nhat ghi chu');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tra hang va them lai ton kho (Return items and add stock back)
     * @param issueId - Issue ID
     * @param data - ReturnIssueV2DTO with lines to return
     * @param idempotencyKey - UUID for idempotent request
     * @returns Updated issue
     */
    returnItems: function (issueId, data, idempotencyKey) {
        return __awaiter(this, void 0, void 0, function () {
            var key, payload, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = idempotencyKey || crypto.randomUUID();
                        payload = __assign(__assign({}, data), { idempotency_key: key });
                        return [4 /*yield*/, (0, api_1.fetchApi)("".concat(BASE, "/").concat(issueId, "/return"), {
                                method: 'POST',
                                body: JSON.stringify(payload),
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.error || !response.data) {
                            throw new Error(response.error || 'Khong the tra hang');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
};
