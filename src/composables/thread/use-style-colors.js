"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStyleColors = useStyleColors;
var vue_1 = require("vue");
var styleColorService_1 = require("@/services/styleColorService");
var useSnackbar_1 = require("../useSnackbar");
function useStyleColors() {
    var _this = this;
    var styleColors = (0, vue_1.ref)([]);
    var isLoading = (0, vue_1.ref)(false);
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var activeStyleColors = (0, vue_1.computed)(function () { return styleColors.value.filter(function (c) { return c.is_active; }); });
    var fetchStyleColors = function (styleId) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_1, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isLoading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = styleColors;
                    return [4 /*yield*/, styleColorService_1.styleColorService.getByStyleId(styleId)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    msg = err_1 instanceof Error ? err_1.message : 'Lỗi tải màu hàng';
                    snackbar.error(msg);
                    return [3 /*break*/, 5];
                case 4:
                    isLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var createStyleColor = function (styleId, data) { return __awaiter(_this, void 0, void 0, function () {
        var newColor, err_2, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, styleColorService_1.styleColorService.create(styleId, data)];
                case 1:
                    newColor = _a.sent();
                    styleColors.value = __spreadArray(__spreadArray([], styleColors.value, true), [newColor], false);
                    snackbar.success('Thêm màu hàng thành công');
                    return [2 /*return*/, newColor];
                case 2:
                    err_2 = _a.sent();
                    msg = err_2 instanceof Error ? err_2.message : 'Không thể thêm màu hàng';
                    snackbar.error(msg);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var deleteStyleColor = function (styleId, id) { return __awaiter(_this, void 0, void 0, function () {
        var err_3, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, styleColorService_1.styleColorService.remove(styleId, id)];
                case 1:
                    _a.sent();
                    styleColors.value = styleColors.value.filter(function (c) { return c.id !== id; });
                    snackbar.success('Đã xóa màu hàng');
                    return [2 /*return*/, true];
                case 2:
                    err_3 = _a.sent();
                    msg = err_3 instanceof Error ? err_3.message : 'Không thể xóa';
                    snackbar.error(msg);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return {
        styleColors: styleColors,
        activeStyleColors: activeStyleColors,
        isLoading: isLoading,
        fetchStyleColors: fetchStyleColors,
        createStyleColor: createStyleColor,
        deleteStyleColor: deleteStyleColor,
    };
}
