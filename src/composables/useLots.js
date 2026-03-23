"use strict";
/**
 * useLots Composable
 *
 * State management for lot operations.
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
exports.useLots = useLots;
var vue_1 = require("vue");
var lotService_1 = require("@/services/lotService");
var useSnackbar_1 = require("./useSnackbar");
function useLots() {
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var lots = (0, vue_1.ref)([]);
    var currentLot = (0, vue_1.ref)(null);
    var currentCones = (0, vue_1.ref)([]);
    var loading = (0, vue_1.ref)(false);
    var error = (0, vue_1.ref)(null);
    // Computed
    var activeLots = (0, vue_1.computed)(function () { return lots.value.filter(function (l) { return l.status === 'ACTIVE'; }); });
    var hasLots = (0, vue_1.computed)(function () { return lots.value.length > 0; });
    /**
     * Tải danh sách lô
     */
    function fetchLots(filters) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        _a = lots;
                        return [4 /*yield*/, lotService_1.lotService.getAll(filters)];
                    case 2:
                        _a.value = _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _b.sent();
                        error.value = err_1 instanceof Error ? err_1.message : 'Lỗi khi tải danh sách lô';
                        snackbar.error(error.value);
                        return [3 /*break*/, 5];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Tải chi tiết lô
     */
    function fetchLot(id) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        _a = currentLot;
                        return [4 /*yield*/, lotService_1.lotService.getById(id)];
                    case 2:
                        _a.value = _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_2 = _b.sent();
                        error.value = err_2 instanceof Error ? err_2.message : 'Lỗi khi tải thông tin lô';
                        snackbar.error(error.value);
                        return [3 /*break*/, 5];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Tải danh sách cuộn trong lô
     */
    function fetchLotCones(lotId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        loading.value = true;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        _a = currentCones;
                        return [4 /*yield*/, lotService_1.lotService.getCones(lotId)];
                    case 2:
                        _a.value = _c.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        _b = _c.sent();
                        snackbar.error('Lỗi khi tải danh sách cuộn');
                        return [3 /*break*/, 5];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Tạo lô mới
     */
    function createLot(data) {
        return __awaiter(this, void 0, void 0, function () {
            var newLot, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, lotService_1.lotService.create(data)];
                    case 2:
                        newLot = _a.sent();
                        lots.value.unshift(newLot);
                        snackbar.success('Đã tạo lô mới');
                        return [2 /*return*/, newLot];
                    case 3:
                        err_3 = _a.sent();
                        error.value = err_3 instanceof Error ? err_3.message : 'Lỗi khi tạo lô';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Cập nhật lô
     */
    function updateLot(id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updated, index, err_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, lotService_1.lotService.update(id, data)];
                    case 2:
                        updated = _b.sent();
                        index = lots.value.findIndex(function (l) { return l.id === id; });
                        if (index !== -1)
                            lots.value[index] = updated;
                        if (((_a = currentLot.value) === null || _a === void 0 ? void 0 : _a.id) === id)
                            currentLot.value = updated;
                        snackbar.success('Đã cập nhật thông tin lô');
                        return [2 /*return*/, updated];
                    case 3:
                        err_4 = _b.sent();
                        error.value = err_4 instanceof Error ? err_4.message : 'Lỗi khi cập nhật lô';
                        snackbar.error(error.value);
                        return [2 /*return*/, null];
                    case 4:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Đặt trạng thái quarantine
     */
    function quarantineLot(id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, updateLot(id, { status: 'QUARANTINE' })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result !== null];
                }
            });
        });
    }
    /**
     * Giải phóng khỏi quarantine
     */
    function releaseLot(id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, updateLot(id, { status: 'ACTIVE' })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result !== null];
                }
            });
        });
    }
    /**
     * Reset state
     */
    function reset() {
        lots.value = [];
        currentLot.value = null;
        currentCones.value = [];
        error.value = null;
    }
    return {
        // State
        lots: lots,
        currentLot: currentLot,
        currentCones: currentCones,
        loading: loading,
        error: error,
        // Computed
        activeLots: activeLots,
        hasLots: hasLots,
        // Actions
        fetchLots: fetchLots,
        fetchLot: fetchLot,
        fetchLotCones: fetchLotCones,
        createLot: createLot,
        updateLot: updateLot,
        quarantineLot: quarantineLot,
        releaseLot: releaseLot,
        reset: reset
    };
}
