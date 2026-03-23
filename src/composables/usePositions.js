"use strict";
/**
 * Position Management Composable
 *
 * Provides reactive state for positions (Chức Vụ)
 * Fetches positions from positions table with internal name and display name
 * Used by employee form dropdowns
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
exports.usePositions = usePositions;
var vue_1 = require("vue");
var positionService_1 = require("@/services/positionService");
var useSnackbar_1 = require("./useSnackbar");
var useLoading_1 = require("./useLoading");
/**
 * Vietnamese error messages for user feedback
 */
var MESSAGES = {
    FETCH_ERROR: 'Không thể tải danh sách chức vụ',
    SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
};
function usePositions() {
    var _this = this;
    // State - stores position options with { value, label }
    var positions = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasPositions = (0, vue_1.computed)(function () { return positions.value.length > 0; });
    /**
     * Position options for dropdown select
     * Already in { label, value } format from API
     */
    var positionOptions = (0, vue_1.computed)(function () {
        return positions.value;
    });
    /**
     * Position labels mapping (value -> label)
     * Maps internal name (e.g., 'nhan_vien') to display name (e.g., 'Nhân Viên')
     */
    var positionLabels = (0, vue_1.computed)(function () {
        var labels = {};
        for (var _i = 0, _a = positions.value; _i < _a.length; _i++) {
            var pos = _a[_i];
            labels[pos.value] = pos.label;
        }
        return labels;
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch positions from positions table
     */
    var fetchPositions = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
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
                                    case 0: return [4 /*yield*/, positionService_1.positionService.getUniquePositions()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    positions.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = err_1 instanceof Error && /[\u00C0-\u1EF9]/.test(err_1.message)
                        ? err_1.message
                        : MESSAGES.FETCH_ERROR;
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[usePositions] fetchPositions error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Get position display label by value
     * Returns display name for internal name (e.g., 'nhan_vien' -> 'Nhân Viên')
     */
    var getPositionLabel = function (value) {
        return positionLabels.value[value] || value;
    };
    return {
        // State
        positions: positions,
        error: error,
        loading: isLoading,
        // Computed
        hasPositions: hasPositions,
        positionOptions: positionOptions,
        positionLabels: positionLabels,
        // Actions
        fetchPositions: fetchPositions,
        clearError: clearError,
        getPositionLabel: getPositionLabel,
    };
}
