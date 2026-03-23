"use strict";
/**
 * Style Thread Specs Composable
 *
 * Provides reactive state and operations for style thread specification management.
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
exports.useStyleThreadSpecs = useStyleThreadSpecs;
var vue_1 = require("vue");
var services_1 = require("@/services");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useStyleThreadSpecs() {
    var _this = this;
    // State
    var styleThreadSpecs = (0, vue_1.ref)([]);
    var colorSpecs = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var selectedSpec = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var specCount = (0, vue_1.computed)(function () { return styleThreadSpecs.value.length; });
    var colorSpecCount = (0, vue_1.computed)(function () { return colorSpecs.value.length; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all style thread specs from API
     * @param newFilters - Optional filters to apply
     */
    var fetchStyleThreadSpecs = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    styleThreadSpecs.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] fetchStyleThreadSpecs error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch a single style thread spec by ID
     * @param id - Spec ID
     */
    var fetchSpecById = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.getById(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    selectedSpec.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] fetchSpecById error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new style thread spec
     * @param data - Spec creation data
     */
    var createSpec = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_3, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Tạo định mức chỉ thành công');
                    return [4 /*yield*/, fetchStyleThreadSpecs()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] createSpec error:', err_3);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update a style thread spec
     * @param id - Spec ID
     * @param data - Spec update data
     */
    var updateSpec = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.update(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Cập nhật định mức chỉ thành công');
                    return [4 /*yield*/, fetchStyleThreadSpecs()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] updateSpec error:', err_4);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete a style thread spec
     * @param id - Spec ID
     */
    var deleteSpec = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_5, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.delete(id)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success('Xóa định mức chỉ thành công');
                    return [4 /*yield*/, fetchStyleThreadSpecs()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_5 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_5);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] deleteSpec error:', err_5);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch color specs for a spec
     * @param specId - Style thread spec ID
     */
    var fetchColorSpecs = function (specId) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_6, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.getColorSpecs(specId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    colorSpecs.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_6 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_6);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] fetchColorSpecs error:', err_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Add a color spec
     * @param specId - Style thread spec ID
     * @param data - Color spec creation data
     */
    var addColorSpec = function (specId, data) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_7, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.addColorSpec(specId, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    snackbar.success('Thêm định mức chỉ theo màu thành công');
                    return [4 /*yield*/, fetchColorSpecs(specId)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4:
                    err_7 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_7);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] addColorSpec error:', err_7);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch ALL color specs for a style (batch - all specs at once)
     * @param styleId - Style ID
     */
    var fetchAllColorSpecsByStyle = function (styleId) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_8, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.styleThreadSpecService.getAllColorSpecsByStyle(styleId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    colorSpecs.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_8 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_8);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] fetchAllColorSpecsByStyle error:', err_8);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update a color spec (inline edit)
     * @param colorSpecId - Color spec ID
     * @param data - Update data
     */
    var updateColorSpec = function (colorSpecId, data) { return __awaiter(_this, void 0, void 0, function () {
        var result, index, err_9, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, services_1.styleThreadSpecService.updateColorSpec(colorSpecId, data)
                        // Update local state
                    ];
                case 2:
                    result = _a.sent();
                    index = colorSpecs.value.findIndex(function (cs) { return cs.id === colorSpecId; });
                    if (index !== -1) {
                        colorSpecs.value[index] = result;
                    }
                    return [2 /*return*/, result];
                case 3:
                    err_9 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_9);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] updateColorSpec error:', err_9);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete a color spec
     * @param colorSpecId - Color spec ID
     */
    var deleteColorSpec = function (colorSpecId) { return __awaiter(_this, void 0, void 0, function () {
        var err_10, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, services_1.styleThreadSpecService.deleteColorSpec(colorSpecId)
                        // Remove from local state
                    ];
                case 2:
                    _a.sent();
                    // Remove from local state
                    colorSpecs.value = colorSpecs.value.filter(function (cs) { return cs.id !== colorSpecId; });
                    snackbar.success('Xóa định mức màu thành công');
                    return [2 /*return*/, true];
                case 3:
                    err_10 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_10);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useStyleThreadSpecs] deleteColorSpec error:', err_10);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        styleThreadSpecs: styleThreadSpecs,
        colorSpecs: colorSpecs,
        error: error,
        filters: filters,
        selectedSpec: selectedSpec,
        // Computed
        isLoading: isLoading,
        specCount: specCount,
        colorSpecCount: colorSpecCount,
        // Actions
        clearError: clearError,
        fetchStyleThreadSpecs: fetchStyleThreadSpecs,
        fetchSpecById: fetchSpecById,
        createSpec: createSpec,
        updateSpec: updateSpec,
        deleteSpec: deleteSpec,
        fetchColorSpecs: fetchColorSpecs,
        addColorSpec: addColorSpec,
        fetchAllColorSpecsByStyle: fetchAllColorSpecsByStyle,
        updateColorSpec: updateColorSpec,
        deleteColorSpec: deleteColorSpec,
    };
}
