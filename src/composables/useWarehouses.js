"use strict";
/**
 * Warehouse Management Composable
 *
 * Provides centralized warehouse options for dropdowns.
 * Supports hierarchy with LOCATION (địa điểm) and STORAGE (kho) types.
 * Fetches data from /api/warehouses endpoint.
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
exports.useWarehouses = useWarehouses;
var vue_1 = require("vue");
var warehouseService_1 = require("@/services/warehouseService");
var useSnackbar_1 = require("./useSnackbar");
var useLoading_1 = require("./useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useWarehouses() {
    var _this = this;
    // State
    var warehouses = (0, vue_1.ref)([]);
    var warehouseTree = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    /**
     * Get only LOCATION type warehouses
     */
    var locations = (0, vue_1.computed)(function () {
        return warehouses.value.filter(function (w) { return w.type === 'LOCATION'; });
    });
    /**
     * Get only STORAGE type warehouses
     */
    var storageWarehouses = (0, vue_1.computed)(function () {
        return warehouses.value.filter(function (w) { return w.type === 'STORAGE'; });
    });
    /**
     * Group warehouses by location
     * Returns a map of locationId -> storage warehouses
     */
    var warehousesByLocation = (0, vue_1.computed)(function () {
        var map = new Map();
        for (var _i = 0, _a = storageWarehouses.value; _i < _a.length; _i++) {
            var w = _a[_i];
            if (w.parent_id) {
                var existing = map.get(w.parent_id) || [];
                existing.push(w);
                map.set(w.parent_id, existing);
            }
        }
        return map;
    });
    /**
     * Transform warehouses to dropdown options (flat list - backward compatible)
     * Format: "Tên Kho (MÃ KHO)"
     */
    var warehouseOptions = (0, vue_1.computed)(function () {
        return warehouses.value.map(function (w) { return ({
            label: "".concat(w.name, " (").concat(w.code, ")"),
            value: w.id,
            type: w.type,
            disabled: w.type === 'LOCATION', // LOCATION is not selectable for inventory
        }); });
    });
    /**
     * Transform to grouped options for QSelect with headers
     * LOCATIONs appear as disabled headers, STORAGEs are selectable
     */
    var groupedWarehouseOptions = (0, vue_1.computed)(function () {
        var options = [];
        for (var _i = 0, _a = warehouseTree.value; _i < _a.length; _i++) {
            var location_1 = _a[_i];
            // Add location as header (disabled)
            options.push({
                label: location_1.name,
                value: null,
                type: 'LOCATION',
                disabled: true,
                parentId: null,
            });
            // Add children as selectable options
            for (var _b = 0, _c = location_1.children; _b < _c.length; _b++) {
                var storage = _c[_b];
                options.push({
                    label: "  ".concat(storage.name), // Indented
                    value: storage.id,
                    type: 'STORAGE',
                    disabled: false,
                    parentId: location_1.id,
                });
            }
        }
        return options;
    });
    /**
     * Get only storage options (for inventory operations)
     */
    var storageOptions = (0, vue_1.computed)(function () {
        return storageWarehouses.value.map(function (w) { return ({
            label: "".concat(w.name, " (").concat(w.code, ")"),
            value: w.id,
            type: 'STORAGE',
        }); });
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all warehouses from API (flat list)
     */
    var fetchWarehouses = function () { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, warehouseService_1.warehouseService.getAll()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    warehouses.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWarehouses] fetchWarehouses error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch warehouse tree structure
     */
    var fetchWarehouseTree = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, flatList, _i, data_1, location_2, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, warehouseService_1.warehouseService.getTree()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    warehouseTree.value = data;
                    flatList = [];
                    for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                        location_2 = data_1[_i];
                        flatList.push(location_2);
                        flatList.push.apply(flatList, location_2.children);
                    }
                    warehouses.value = flatList;
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useWarehouses] fetchWarehouseTree error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Get warehouse label by ID
     * @param id - Warehouse ID
     * @returns Warehouse label or empty string if not found
     */
    var getWarehouseLabel = function (id) {
        var warehouse = warehouses.value.find(function (w) { return w.id === id; });
        if (!warehouse)
            return '';
        return "".concat(warehouse.name, " (").concat(warehouse.code, ")");
    };
    /**
     * Find a warehouse by ID from local state
     * @param id - Warehouse ID
     * @returns Warehouse or undefined if not found
     */
    var getWarehouseById = function (id) {
        return warehouses.value.find(function (w) { return w.id === id; });
    };
    /**
     * Get parent location name for a storage warehouse
     * @param warehouseId - Storage warehouse ID
     * @returns Location name or empty string
     */
    var getLocationName = function (warehouseId) {
        var warehouse = getWarehouseById(warehouseId);
        if (!warehouse || !warehouse.parent_id)
            return '';
        var location = getWarehouseById(warehouse.parent_id);
        return (location === null || location === void 0 ? void 0 : location.name) || '';
    };
    /**
     * Get all storage warehouses under a location
     * @param locationId - Location warehouse ID
     * @returns Array of storage warehouses
     */
    var getStoragesForLocation = function (locationId) {
        return warehousesByLocation.value.get(locationId) || [];
    };
    return {
        // State
        warehouses: warehouses,
        warehouseTree: warehouseTree,
        loading: isLoading,
        error: error,
        // Computed - hierarchy
        locations: locations,
        storageWarehouses: storageWarehouses,
        warehousesByLocation: warehousesByLocation,
        // Computed - options
        warehouseOptions: warehouseOptions,
        groupedWarehouseOptions: groupedWarehouseOptions,
        storageOptions: storageOptions,
        // Methods
        fetchWarehouses: fetchWarehouses,
        fetchWarehouseTree: fetchWarehouseTree,
        getWarehouseLabel: getWarehouseLabel,
        getWarehouseById: getWarehouseById,
        getLocationName: getLocationName,
        getStoragesForLocation: getStoragesForLocation,
        clearError: clearError,
    };
}
