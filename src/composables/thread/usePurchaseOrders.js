"use strict";
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
exports.usePurchaseOrders = usePurchaseOrders;
var vue_1 = require("vue");
var services_1 = require("@/services");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function usePurchaseOrders() {
    var _this = this;
    var purchaseOrders = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var selectedPurchaseOrder = (0, vue_1.ref)(null);
    var currentPage = (0, vue_1.ref)(1);
    var pageSize = (0, vue_1.ref)(25);
    var sortBy = (0, vue_1.ref)('created_at');
    var descending = (0, vue_1.ref)(true);
    var totalCount = (0, vue_1.ref)(0);
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var purchaseOrderCount = (0, vue_1.computed)(function () { return purchaseOrders.value.length; });
    var clearError = function () {
        error.value = null;
    };
    var fetchPurchaseOrders = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    if (newFilters) {
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.getPaginated({
                                            page: currentPage.value,
                                            pageSize: pageSize.value,
                                            sortBy: sortBy.value,
                                            descending: descending.value,
                                            status: filters.value.status,
                                            priority: filters.value.priority,
                                            customer_name: filters.value.customer_name,
                                            po_number: filters.value.po_number,
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    purchaseOrders.value = result.data;
                    totalCount.value = result.count;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] fetchPurchaseOrders error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchAllPurchaseOrders = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    if (newFilters) {
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    purchaseOrders.value = data;
                    totalCount.value = data.length;
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] fetchAllPurchaseOrders error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleTableRequest = function (props) { return __awaiter(_this, void 0, void 0, function () {
        var _a, page, rowsPerPage, sort, desc;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = props.pagination, page = _a.page, rowsPerPage = _a.rowsPerPage, sort = _a.sortBy, desc = _a.descending;
                    currentPage.value = page;
                    pageSize.value = rowsPerPage;
                    sortBy.value = sort || 'created_at';
                    descending.value = desc;
                    return [4 /*yield*/, fetchPurchaseOrders()];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var fetchPurchaseOrderById = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_3, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    selectedPurchaseOrder.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] fetchPurchaseOrderById error:', err_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var createPurchaseOrder = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_4, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Tao don hang thanh cong');
                    return [4 /*yield*/, fetchPurchaseOrders()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] createPurchaseOrder error:', err_4);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var updatePurchaseOrder = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_5, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.update(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Cap nhat don hang thanh cong');
                    return [4 /*yield*/, fetchPurchaseOrders()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_5 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_5);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] updatePurchaseOrder error:', err_5);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var deletePurchaseOrder = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_6, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, services_1.purchaseOrderService.delete(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success('Xoa don hang thanh cong');
                    return [4 /*yield*/, fetchPurchaseOrders()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_6 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_6);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePurchaseOrders] deletePurchaseOrder error:', err_6);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return {
        purchaseOrders: purchaseOrders,
        error: error,
        filters: filters,
        selectedPurchaseOrder: selectedPurchaseOrder,
        currentPage: currentPage,
        pageSize: pageSize,
        totalCount: totalCount,
        isLoading: isLoading,
        purchaseOrderCount: purchaseOrderCount,
        clearError: clearError,
        fetchPurchaseOrders: fetchPurchaseOrders,
        fetchAllPurchaseOrders: fetchAllPurchaseOrders,
        fetchPurchaseOrderById: fetchPurchaseOrderById,
        createPurchaseOrder: createPurchaseOrder,
        updatePurchaseOrder: updatePurchaseOrder,
        deletePurchaseOrder: deletePurchaseOrder,
        handleTableRequest: handleTableRequest,
    };
}
