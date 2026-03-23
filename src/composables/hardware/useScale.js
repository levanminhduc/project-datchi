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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScale = useScale;
var vue_1 = require("vue");
function useScale() {
    var _this = this;
    var isConnected = (0, vue_1.ref)(false);
    var isConnecting = (0, vue_1.ref)(false);
    var currentWeight = (0, vue_1.ref)(null);
    var isStable = (0, vue_1.ref)(false);
    var error = (0, vue_1.ref)(null);
    var readings = (0, vue_1.ref)([]);
    var port = null;
    var reader = null;
    // Check if Web Serial API is supported
    var isSupported = (0, vue_1.computed)(function () { return 'serial' in navigator; });
    // Connect to scale
    var connect = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isSupported.value) {
                        error.value = 'Trình duyệt không hỗ trợ kết nối cân';
                        return [2 /*return*/, false];
                    }
                    isConnecting.value = true;
                    error.value = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, navigator.serial.requestPort()
                        // Open with typical scale baud rate
                    ];
                case 2:
                    // Request port from user
                    port = _a.sent();
                    // Open with typical scale baud rate
                    return [4 /*yield*/, port.open({ baudRate: 9600 })];
                case 3:
                    // Open with typical scale baud rate
                    _a.sent();
                    isConnected.value = true;
                    // Start reading
                    startReading();
                    return [2 /*return*/, true];
                case 4:
                    err_1 = _a.sent();
                    error.value = err_1 instanceof Error ? err_1.message : 'Lỗi kết nối cân';
                    return [2 /*return*/, false];
                case 5:
                    isConnecting.value = false;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Disconnect from scale
    var disconnect = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    if (!reader) return [3 /*break*/, 2];
                    return [4 /*yield*/, reader.cancel()];
                case 1:
                    _b.sent();
                    reader = null;
                    _b.label = 2;
                case 2:
                    if (!port) return [3 /*break*/, 4];
                    return [4 /*yield*/, port.close()];
                case 3:
                    _b.sent();
                    port = null;
                    _b.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 6:
                    isConnected.value = false;
                    currentWeight.value = null;
                    return [2 /*return*/];
            }
        });
    }); };
    // Start reading data from scale
    var startReading = function () { return __awaiter(_this, void 0, void 0, function () {
        var decoder, inputStream, buffer, _a, value, done, match, weightStr, unitStr, weight, unit, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(port === null || port === void 0 ? void 0 : port.readable))
                        return [2 /*return*/];
                    decoder = new TextDecoderStream();
                    inputStream = port.readable.pipeThrough(decoder);
                    reader = inputStream.getReader();
                    buffer = '';
                    _c.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, reader.read()];
                case 3:
                    _a = _c.sent(), value = _a.value, done = _a.done;
                    if (done)
                        return [3 /*break*/, 6];
                    buffer += value !== null && value !== void 0 ? value : '';
                    match = buffer.match(/([+-]?\d+\.?\d*)\s*(g|kg)/i);
                    if (match) {
                        weightStr = match[1];
                        unitStr = match[2];
                        if (weightStr && unitStr) {
                            weight = parseFloat(weightStr);
                            unit = unitStr.toLowerCase();
                            if (unit === 'kg')
                                weight *= 1000;
                            currentWeight.value = weight;
                            isStable.value = !buffer.includes('?') && !buffer.includes('~');
                            readings.value.push({
                                weight: weight,
                                stable: isStable.value,
                                unit: 'g',
                                timestamp: new Date(),
                            });
                            // Keep last 10 readings
                            if (readings.value.length > 10) {
                                readings.value.shift();
                            }
                        }
                        buffer = '';
                    }
                    return [3 /*break*/, 5];
                case 4:
                    _b = _c.sent();
                    return [3 /*break*/, 6];
                case 5: return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Capture current stable weight
    var capture = function () {
        if (isStable.value && currentWeight.value !== null) {
            return currentWeight.value;
        }
        return null;
    };
    // Tare (zero) the scale - send command
    var tare = function () { return __awaiter(_this, void 0, void 0, function () {
        var writer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(port === null || port === void 0 ? void 0 : port.writable))
                        return [2 /*return*/];
                    writer = port.writable.getWriter();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    // Common tare command
                    return [4 /*yield*/, writer.write(new TextEncoder().encode('T\r\n'))];
                case 2:
                    // Common tare command
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    writer.releaseLock();
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    (0, vue_1.onUnmounted)(function () {
        disconnect();
    });
    return {
        // State
        isSupported: isSupported,
        isConnected: isConnected,
        isConnecting: isConnecting,
        currentWeight: currentWeight,
        isStable: isStable,
        error: error,
        readings: readings,
        // Methods
        connect: connect,
        disconnect: disconnect,
        capture: capture,
        tare: tare,
    };
}
