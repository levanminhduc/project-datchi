"use strict";
/**
 * Recovery API Service
 *
 * Handles API calls for thread cone recovery operations.
 * Supports initiating returns, weighing, confirming, and writing off cones.
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
exports.recoveryService = void 0;
var api_1 = require("./api");
/**
 * Build query string from filters object
 * Handles undefined values by omitting them
 */
function buildQueryString(filters) {
    if (!filters)
        return '';
    var params = new URLSearchParams();
    if (filters.status)
        params.append('status', filters.status);
    if (filters.cone_id)
        params.append('cone_id', filters.cone_id);
    if (filters.from_date)
        params.append('from_date', filters.from_date);
    if (filters.to_date)
        params.append('to_date', filters.to_date);
    var queryString = params.toString();
    return queryString ? "?".concat(queryString) : '';
}
exports.recoveryService = {
    /**
     * Lấy tất cả bản ghi recovery với bộ lọc
     * @param filters - Optional filters for status, cone_id, date range
     * @returns Array of recovery records
     */
    getAll: function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var queryString, separator, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryString = buildQueryString(filters);
                        separator = queryString ? '&' : '?';
                        return [4 /*yield*/, (0, api_1.fetchApi)("/api/recovery".concat(queryString).concat(separator, "limit=0"))];
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
     * Lấy thông tin recovery theo ID
     * @param id - Recovery ID
     * @returns Recovery record with cone details
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/recovery/".concat(id))];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không tìm thấy bản ghi hoàn trả');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Khởi tạo hoàn trả cone (từ quét barcode)
     * Tạo bản ghi recovery với trạng thái INITIATED
     * @param data - InitiateReturnDTO with cone_id (barcode), returned_by, notes
     * @returns Created recovery record
     */
    initiate: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/recovery', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể khởi tạo hoàn trả');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Ghi nhận trọng lượng cone đã hoàn trả
     * Tính toán số mét còn lại dựa trên trọng lượng
     * Chuyển trạng thái từ INITIATED/PENDING_WEIGH -> WEIGHED
     * @param id - Recovery ID
     * @param data - WeighConeDTO with weight_grams, optional tare_weight_grams
     * @returns Updated recovery with calculated meters
     */
    weigh: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/recovery/".concat(id, "/weigh"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể ghi nhận trọng lượng');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Xác nhận hoàn trả cone
     * Cập nhật inventory, chuyển trạng thái cone về AVAILABLE
     * Chuyển trạng thái recovery từ WEIGHED -> CONFIRMED
     * @param id - Recovery ID
     * @param confirmedBy - Optional confirmer name
     * @returns Updated recovery record
     */
    confirm: function (id, confirmedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/recovery/".concat(id, "/confirm"), {
                            method: 'POST',
                            body: JSON.stringify({ confirmed_by: confirmedBy }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể xác nhận hoàn trả');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Loại bỏ cone (write off)
     * Đánh dấu cone là WRITTEN_OFF, không trả về inventory
     * Dùng khi cone bị hỏng, lỗi, hoặc không đủ tiêu chuẩn
     * @param id - Recovery ID
     * @param data - WriteOffDTO with reason and approved_by
     * @returns Updated recovery record
     */
    writeOff: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/recovery/".concat(id, "/write-off"), {
                            method: 'POST',
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error);
                        }
                        if (!response.data) {
                            throw new Error('Không thể loại bỏ cuộn chỉ');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Lấy danh sách recovery đang chờ cân
     * Shortcut cho getAll với filter status = PENDING_WEIGH
     * @returns Array of pending weigh records
     */
    getPending: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAll({ status: 'PENDING_WEIGH' })];
            });
        });
    },
};
