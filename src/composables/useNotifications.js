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
exports.useNotifications = useNotifications;
var vue_1 = require("vue");
var notificationService_1 = require("@/services/notificationService");
var notifications = (0, vue_1.ref)([]);
var unreadCount = (0, vue_1.ref)(0);
var isLoading = (0, vue_1.ref)(false);
var pollingInterval = null;
var subscriberCount = 0;
function useNotifications() {
    function fetchNotifications(params) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        isLoading.value = true;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        _a = notifications;
                        return [4 /*yield*/, notificationService_1.notificationService.getNotifications(params)];
                    case 2:
                        _a.value = _c.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        _b = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        isLoading.value = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function fetchUnreadCount() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = unreadCount;
                        return [4 /*yield*/, notificationService_1.notificationService.getUnreadCount()];
                    case 1:
                        _a.value = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _b = _c.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function markAsRead(id) {
        return __awaiter(this, void 0, void 0, function () {
            var notification, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, notificationService_1.notificationService.markAsRead(id)];
                    case 1:
                        _b.sent();
                        notification = notifications.value.find(function (n) { return n.id === id; });
                        if (notification && !notification.is_read) {
                            notification.is_read = true;
                            unreadCount.value = Math.max(0, unreadCount.value - 1);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function markAllAsRead() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, notificationService_1.notificationService.markAllAsRead()];
                    case 1:
                        _b.sent();
                        notifications.value.forEach(function (n) { n.is_read = true; });
                        unreadCount.value = 0;
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function deleteNotification(id) {
        return __awaiter(this, void 0, void 0, function () {
            var notification, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, notificationService_1.notificationService.deleteNotification(id)];
                    case 1:
                        _b.sent();
                        notification = notifications.value.find(function (n) { return n.id === id; });
                        if (notification && !notification.is_read) {
                            unreadCount.value = Math.max(0, unreadCount.value - 1);
                        }
                        notifications.value = notifications.value.filter(function (n) { return n.id !== id; });
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function startPolling(intervalMs) {
        if (intervalMs === void 0) { intervalMs = 30000; }
        subscriberCount++;
        if (pollingInterval)
            return;
        fetchUnreadCount();
        pollingInterval = setInterval(function () {
            fetchUnreadCount();
        }, intervalMs);
    }
    function stopPolling() {
        subscriberCount--;
        if (subscriberCount <= 0 && pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            subscriberCount = 0;
        }
    }
    (0, vue_1.onUnmounted)(function () {
        stopPolling();
    });
    return {
        notifications: notifications,
        unreadCount: unreadCount,
        isLoading: isLoading,
        fetchNotifications: fetchNotifications,
        fetchUnreadCount: fetchUnreadCount,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        deleteNotification: deleteNotification,
        startPolling: startPolling,
        stopPolling: stopPolling,
    };
}
