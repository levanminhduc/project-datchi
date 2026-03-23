"use strict";
/**
 * Thread Calculation Composable
 *
 * Provides reactive state and operations for thread calculation.
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
exports.useThreadCalculation = useThreadCalculation;
var vue_1 = require("vue");
var services_1 = require("@/services");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useThreadCalculation() {
    var _this = this;
    // State
    var calculationResult = (0, vue_1.ref)(null);
    var poCalculationResults = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasResults = (0, vue_1.computed)(function () {
        return calculationResult.value !== null || poCalculationResults.value.length > 0;
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Clear all results
     */
    var clearResults = function () {
        calculationResult.value = null;
        poCalculationResults.value = [];
    };
    /**
     * Calculate thread requirements by style and quantity
     */
    var calculate = function (input) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.threadCalculationService.calculate(input)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    calculationResult.value = result;
                    snackbar.success('Tính toán định mức chỉ thành công');
                    return [2 /*return*/, result];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadCalculation] calculate error:', err_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Calculate thread requirements by PO
     */
    var calculateByPO = function (input) { return __awaiter(_this, void 0, void 0, function () {
        var results, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, services_1.threadCalculationService.calculateByPO(input)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    results = _a.sent();
                    poCalculationResults.value = results;
                    snackbar.success('Tính toán định mức chỉ theo đơn hàng thành công');
                    return [2 /*return*/, results];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadCalculation] calculateByPO error:', err_2);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        calculationResult: calculationResult,
        poCalculationResults: poCalculationResults,
        error: error,
        // Computed
        isLoading: isLoading,
        hasResults: hasResults,
        // Actions
        clearError: clearError,
        clearResults: clearResults,
        calculate: calculate,
        calculateByPO: calculateByPO,
    };
}
