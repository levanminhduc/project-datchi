"use strict";
/**
 * Employee API Service
 *
 * Handles all HTTP operations for employee management
 * Uses fetchApi for consistent error handling
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
exports.employeeService = void 0;
var api_1 = require("./api");
exports.employeeService = {
    /**
     * Lấy danh sách tất cả nhân viên
     * Uses limit=0 to fetch all records for virtual scroll
     * @returns Array of employees
     */
    getAll: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/employees?limit=0')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    /**
     * Lấy thông tin nhân viên theo ID
     * @param id - Employee ID
     * @returns Employee or null if not found
     */
    getById: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/employees/".concat(id))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    },
    /**
     * Tạo nhân viên mới
     * @param data - Employee form data
     * @returns Created employee
     */
    create: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/employees', {
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
     * Cập nhật thông tin nhân viên
     * @param id - Employee ID
     * @param data - Partial employee data to update
     * @returns Updated employee
     */
    update: function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/employees/".concat(id), {
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
     * Xóa nhân viên
     * @param id - Employee ID
     */
    delete: function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/employees/".concat(id), {
                            method: 'DELETE',
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Lấy số lượng nhân viên đang hoạt động
     * @returns Count of active employees
     */
    getActiveCount: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/employees/count')];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, ((_a = response.data) === null || _a === void 0 ? void 0 : _a.count) || 0];
                }
            });
        });
    },
    /**
     * Lấy danh sách các bộ phận (departments) duy nhất
     * @returns Array of unique department names
     */
    getDepartments: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)('/api/employees/departments')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    },
    resetPassword: function (id, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.fetchApi)("/api/auth/reset-password/".concat(id), {
                            method: 'POST',
                            body: JSON.stringify({ newPassword: newPassword }),
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, !response.error];
                }
            });
        });
    },
};
