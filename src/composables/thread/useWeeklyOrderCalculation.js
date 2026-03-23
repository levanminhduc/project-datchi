"use strict";
/**
 * Weekly Order Calculation Composable
 *
 * Manages multi-style selection, parallel calculation, and aggregation
 * for weekly thread ordering. Supports PO → Style → Color flow.
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
exports.useWeeklyOrderCalculation = useWeeklyOrderCalculation;
var vue_1 = require("vue");
var threadCalculationService_1 = require("@/services/threadCalculationService");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
/**
 * Generate a unique key for an order entry (po_id + style_id + sub_art_id)
 */
function entryKey(poId, styleId, subArtId) {
    return "".concat(poId !== null && poId !== void 0 ? poId : 'null', "_").concat(styleId, "_").concat(subArtId !== null && subArtId !== void 0 ? subArtId : 'null');
}
function useWeeklyOrderCalculation() {
    var _this = this;
    // State
    var orderEntries = (0, vue_1.ref)([]);
    var perStyleResults = (0, vue_1.ref)([]);
    var aggregatedResults = (0, vue_1.ref)([]);
    var isCalculating = (0, vue_1.ref)(false);
    var isReordering = (0, vue_1.ref)(false);
    var calculationProgress = (0, vue_1.ref)({ current: 0, total: 0 });
    var calculationErrors = (0, vue_1.ref)([]);
    var lastCalculatedAt = (0, vue_1.ref)(null);
    var lastModifiedAt = (0, vue_1.ref)(null);
    var calculationWarnings = (0, vue_1.ref)([]);
    // Delivery date overrides: spec_id → YYYY-MM-DD string
    var deliveryDateOverrides = (0, vue_1.reactive)(new Map());
    // Ordered quantities from previous weeks: "po_id_style_id" → info
    var orderedQuantities = (0, vue_1.ref)(new Map());
    // Track which styles require sub-art selection: styleId → boolean
    var subArtRequired = (0, vue_1.reactive)(new Map());
    // Computed
    var canCalculate = (0, vue_1.computed)(function () {
        var hasQuantity = orderEntries.value.some(function (entry) {
            return entry.colors.some(function (c) { return c.quantity > 0; });
        });
        if (!hasQuantity)
            return false;
        var missingSubArt = orderEntries.value.some(function (entry) { return subArtRequired.get(entry.style_id) && !entry.sub_art_id; });
        return !missingSubArt;
    });
    var subArtMissing = (0, vue_1.computed)(function () {
        return orderEntries.value.some(function (entry) { return subArtRequired.get(entry.style_id) && !entry.sub_art_id; });
    });
    var canCalculateReason = (0, vue_1.computed)(function () {
        var hasQuantity = orderEntries.value.some(function (entry) {
            return entry.colors.some(function (c) { return c.quantity > 0; });
        });
        if (!hasQuantity)
            return 'Chưa có số lượng nào được nhập';
        if (subArtMissing.value)
            return 'Vui lòng chọn Sub-art cho tất cả mã hàng yêu cầu';
        return null;
    });
    var hasResults = (0, vue_1.computed)(function () { return perStyleResults.value.length > 0; });
    var isResultsStale = (0, vue_1.computed)(function () {
        return (lastModifiedAt.value !== null &&
            lastCalculatedAt.value !== null &&
            lastModifiedAt.value > lastCalculatedAt.value);
    });
    var hasOverLimitEntries = (0, vue_1.computed)(function () {
        for (var _i = 0, _a = orderEntries.value; _i < _a.length; _i++) {
            var entry = _a[_i];
            if (!entry.po_id || entry.po_quantity == null)
                continue;
            var currentTotal = entry.colors.reduce(function (sum, c) { return sum + c.quantity; }, 0);
            var maxAllowed = entry.po_quantity - (entry.already_ordered || 0);
            if (currentTotal > maxAllowed)
                return true;
        }
        return false;
    });
    /**
     * Add a style to orderEntries (with PO context)
     */
    var addStyle = function (style) {
        var _a, _b;
        var poId = (_a = style.po_id) !== null && _a !== void 0 ? _a : null;
        var subArtId = (_b = style.sub_art_id) !== null && _b !== void 0 ? _b : null;
        var key = entryKey(poId, style.id, subArtId);
        var exists = orderEntries.value.some(function (e) { return entryKey(e.po_id, e.style_id, e.sub_art_id) === key; });
        if (exists)
            return;
        var qtyInfo = poId ? orderedQuantities.value.get("".concat(poId, "_").concat(style.id)) : undefined;
        orderEntries.value.push({
            po_id: poId,
            po_number: style.po_number || '',
            style_id: style.id,
            style_code: style.style_code,
            style_name: style.style_name,
            colors: [],
            po_quantity: qtyInfo === null || qtyInfo === void 0 ? void 0 : qtyInfo.po_quantity,
            already_ordered: qtyInfo === null || qtyInfo === void 0 ? void 0 : qtyInfo.ordered_quantity,
            sub_art_id: subArtId,
            sub_art_code: style.sub_art_code,
        });
        lastModifiedAt.value = Date.now();
    };
    /**
     * Remove a style from orderEntries by po_id + style_id
     */
    var removeStyle = function (styleId, poId, subArtId) {
        var targetPoId = poId !== null && poId !== void 0 ? poId : null;
        var targetSubArtId = subArtId !== null && subArtId !== void 0 ? subArtId : null;
        orderEntries.value = orderEntries.value.filter(function (e) { var _a; return !(e.style_id === styleId && e.po_id === targetPoId && ((_a = e.sub_art_id) !== null && _a !== void 0 ? _a : null) === targetSubArtId); });
        lastModifiedAt.value = Date.now();
    };
    var updateSubArt = function (styleId, poId, subArtId, subArtCode, oldSubArtId) {
        var entry = orderEntries.value.find(function (e) { return e.style_id === styleId && e.po_id === poId && e.sub_art_id === (oldSubArtId !== null && oldSubArtId !== void 0 ? oldSubArtId : e.sub_art_id); });
        if (!entry)
            return;
        entry.sub_art_id = subArtId;
        entry.sub_art_code = subArtCode;
        lastModifiedAt.value = Date.now();
    };
    /**
     * Remove all entries for a specific PO
     */
    var removePO = function (poId) {
        orderEntries.value = orderEntries.value.filter(function (e) { return e.po_id !== poId; });
        lastModifiedAt.value = Date.now();
    };
    /**
     * Add a color to a style entry with default quantity 1
     */
    var addColorToStyle = function (styleId, color, poId, subArtId) {
        var targetPoId = poId !== null && poId !== void 0 ? poId : null;
        var targetSubArtId = subArtId !== null && subArtId !== void 0 ? subArtId : null;
        var entry = orderEntries.value.find(function (e) { var _a; return e.style_id === styleId && e.po_id === targetPoId && ((_a = e.sub_art_id) !== null && _a !== void 0 ? _a : null) === targetSubArtId; });
        if (!entry)
            return;
        var colorExists = entry.colors.some(function (c) { return c.color_id === color.color_id; });
        if (colorExists)
            return;
        entry.colors.push({
            color_id: color.color_id,
            color_name: color.color_name,
            hex_code: color.hex_code,
            quantity: 1,
            style_color_id: color.style_color_id,
        });
        lastModifiedAt.value = Date.now();
    };
    /**
     * Remove a color from a style entry
     */
    var removeColorFromStyle = function (styleId, colorId, poId, subArtId) {
        var targetPoId = poId !== null && poId !== void 0 ? poId : null;
        var targetSubArtId = subArtId !== null && subArtId !== void 0 ? subArtId : null;
        var entry = orderEntries.value.find(function (e) { var _a; return e.style_id === styleId && e.po_id === targetPoId && ((_a = e.sub_art_id) !== null && _a !== void 0 ? _a : null) === targetSubArtId; });
        if (!entry)
            return;
        entry.colors = entry.colors.filter(function (c) { return c.color_id !== colorId; });
        lastModifiedAt.value = Date.now();
    };
    /**
     * Update the quantity for a specific color in a style entry
     */
    var updateColorQuantity = function (styleId, colorId, qty, poId, subArtId) {
        var targetPoId = poId !== null && poId !== void 0 ? poId : null;
        var targetSubArtId = subArtId !== null && subArtId !== void 0 ? subArtId : null;
        var entry = orderEntries.value.find(function (e) { var _a; return e.style_id === styleId && e.po_id === targetPoId && ((_a = e.sub_art_id) !== null && _a !== void 0 ? _a : null) === targetSubArtId; });
        if (!entry)
            return;
        var color = entry.colors.find(function (c) { return c.color_id === colorId; });
        if (!color)
            return;
        var capped = Math.max(0, qty);
        if (entry.po_id && entry.po_quantity != null) {
            var othersTotal = entry.colors
                .filter(function (c) { return c.color_id !== colorId; })
                .reduce(function (sum, c) { return sum + c.quantity; }, 0);
            var maxForThisColor = Math.max(0, entry.po_quantity - (entry.already_ordered || 0) - othersTotal);
            capped = Math.min(capped, maxForThisColor);
        }
        color.quantity = capped;
        lastModifiedAt.value = Date.now();
    };
    /**
     * Aggregate per-style calculation results into a combined summary keyed by thread_type_id
     */
    var aggregateResults = function (results) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        var map = new Map();
        var specsWithColorBreakdown = new Set();
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var result = results_1[_i];
            for (var _s = 0, _t = result.calculations; _s < _t.length; _s++) {
                var calc = _t[_s];
                if (calc.color_breakdown && calc.color_breakdown.length > 0) {
                    specsWithColorBreakdown.add(calc.spec_id);
                    for (var _u = 0, _v = calc.color_breakdown; _u < _v.length; _u++) {
                        var cb = _v[_u];
                        if (!cb.thread_type_id)
                            continue;
                        var existing = map.get(cb.thread_type_id);
                        if (existing) {
                            existing.total_meters += cb.total_meters;
                        }
                        else {
                            map.set(cb.thread_type_id, {
                                thread_type_id: cb.thread_type_id,
                                thread_type_name: cb.thread_type_name,
                                supplier_name: cb.supplier_name || calc.supplier_name,
                                tex_number: cb.tex_number || calc.tex_number,
                                total_meters: cb.total_meters,
                                total_cones: 0,
                                meters_per_cone: (_b = (_a = cb.meters_per_cone) !== null && _a !== void 0 ? _a : calc.meters_per_cone) !== null && _b !== void 0 ? _b : null,
                                thread_color: (_d = (_c = cb.thread_color) !== null && _c !== void 0 ? _c : calc.thread_color) !== null && _d !== void 0 ? _d : null,
                                thread_color_code: (_f = (_e = cb.thread_color_code) !== null && _e !== void 0 ? _e : calc.thread_color_code) !== null && _f !== void 0 ? _f : null,
                                supplier_id: (_h = (_g = cb.supplier_id) !== null && _g !== void 0 ? _g : calc.supplier_id) !== null && _h !== void 0 ? _h : null,
                                delivery_date: (_j = calc.delivery_date) !== null && _j !== void 0 ? _j : null,
                                lead_time_days: (_k = calc.lead_time_days) !== null && _k !== void 0 ? _k : null,
                            });
                        }
                    }
                }
            }
        }
        for (var _w = 0, results_2 = results; _w < results_2.length; _w++) {
            var result = results_2[_w];
            for (var _x = 0, _y = result.calculations; _x < _y.length; _x++) {
                var calc = _y[_x];
                if (calc.color_breakdown && calc.color_breakdown.length > 0)
                    continue;
                if (specsWithColorBreakdown.has(calc.spec_id))
                    continue;
                var key = calc.thread_type_id;
                var existing = map.get(key);
                if (existing) {
                    existing.total_meters += calc.total_meters;
                }
                else {
                    map.set(key, {
                        thread_type_id: key,
                        thread_type_name: calc.thread_type_name,
                        supplier_name: calc.supplier_name,
                        tex_number: calc.tex_number,
                        total_meters: calc.total_meters,
                        total_cones: 0,
                        meters_per_cone: (_l = calc.meters_per_cone) !== null && _l !== void 0 ? _l : null,
                        thread_color: (_m = calc.thread_color) !== null && _m !== void 0 ? _m : null,
                        thread_color_code: (_o = calc.thread_color_code) !== null && _o !== void 0 ? _o : null,
                        supplier_id: (_p = calc.supplier_id) !== null && _p !== void 0 ? _p : null,
                        delivery_date: (_q = calc.delivery_date) !== null && _q !== void 0 ? _q : null,
                        lead_time_days: (_r = calc.lead_time_days) !== null && _r !== void 0 ? _r : null,
                        is_fallback_type: true,
                    });
                }
            }
        }
        // Recalculate total_cones for each aggregated row
        for (var _z = 0, _0 = map.values(); _z < _0.length; _z++) {
            var row = _0[_z];
            if (row.meters_per_cone && row.meters_per_cone > 0) {
                row.total_cones = Math.ceil(row.total_meters / row.meters_per_cone);
            }
            else {
                row.total_cones = 0;
            }
        }
        aggregatedResults.value = Array.from(map.values()).filter(function (row) { return row.total_meters > 0 && row.thread_type_id > 0; });
    };
    /**
     * Build CalculationInput array from valid order entries
     * Deduplicates by style_id (same style across multiple POs combines quantities)
     */
    var buildBatchInputs = function (entries) {
        // Group by style_id to combine colors from same style across POs
        var styleMap = new Map();
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            if (!styleMap.has(entry.style_id)) {
                styleMap.set(entry.style_id, { entry: entry, colors: new Map() });
            }
            var group = styleMap.get(entry.style_id);
            for (var _a = 0, _b = entry.colors; _a < _b.length; _a++) {
                var c = _b[_a];
                if (c.quantity > 0) {
                    group.colors.set(c.color_id, (group.colors.get(c.color_id) || 0) + c.quantity);
                }
            }
        }
        return Array.from(styleMap.values()).map(function (_a) {
            var entry = _a.entry, colors = _a.colors;
            var totalQty = Array.from(colors.values()).reduce(function (sum, q) { return sum + q; }, 0);
            return {
                input: {
                    style_id: entry.style_id,
                    quantity: totalQty,
                    color_breakdown: Array.from(colors.entries()).map(function (_a) {
                        var color_id = _a[0], quantity = _a[1];
                        return ({
                            color_id: color_id,
                            quantity: quantity,
                        });
                    }),
                },
                entry: entry,
            };
        });
    };
    /**
     * Fallback: Run calculations using N parallel individual requests
     */
    var calculateAllFallback = function (batchItems) { return __awaiter(_this, void 0, void 0, function () {
        var promises, settled, successResults, _i, settled_1, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = batchItems.map(function (_a) {
                        var input = _a.input, entry = _a.entry;
                        return threadCalculationService_1.threadCalculationService
                            .calculate(input)
                            .then(function (result) {
                            calculationProgress.value = __assign(__assign({}, calculationProgress.value), { current: calculationProgress.value.current + 1 });
                            return { status: 'fulfilled', value: result, entry: entry };
                        })
                            .catch(function (err) {
                            calculationProgress.value = __assign(__assign({}, calculationProgress.value), { current: calculationProgress.value.current + 1 });
                            return {
                                status: 'rejected',
                                reason: err instanceof Error ? err.message : 'Lỗi không xác định',
                                entry: entry,
                            };
                        });
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    settled = _a.sent();
                    successResults = [];
                    for (_i = 0, settled_1 = settled; _i < settled_1.length; _i++) {
                        result = settled_1[_i];
                        if (result.status === 'fulfilled') {
                            successResults.push(result.value);
                        }
                        else {
                            calculationErrors.value.push({
                                style_id: result.entry.style_id,
                                style_code: result.entry.style_code,
                                error: result.reason,
                            });
                        }
                    }
                    return [2 /*return*/, successResults];
            }
        });
    }); };
    /**
     * Run calculations for all style entries using batch endpoint (1 request)
     * Falls back to N parallel requests if batch fails
     * @param currentWeekId - Optional week ID to exclude from committed cones calculation
     */
    var calculateAll = function (currentWeekId) { return __awaiter(_this, void 0, void 0, function () {
        var validEntries, batchItems, successResults, batchInputs, results, resultStyleIds, _i, batchItems_1, entry, _a, enriched, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isCalculating.value = true;
                    calculationErrors.value = [];
                    calculationWarnings.value = [];
                    perStyleResults.value = [];
                    deliveryDateOverrides.clear();
                    validEntries = orderEntries.value.filter(function (entry) {
                        return entry.colors.some(function (c) { return c.quantity > 0; });
                    });
                    batchItems = buildBatchInputs(validEntries);
                    calculationProgress.value = { current: 0, total: batchItems.length };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 5]);
                    batchInputs = batchItems.map(function (_a) {
                        var input = _a.input;
                        return input;
                    });
                    return [4 /*yield*/, threadCalculationService_1.threadCalculationService.calculateBatch(batchInputs, true)
                        // Match results back to entries for error reporting on missing styles
                    ];
                case 2:
                    results = _b.sent();
                    resultStyleIds = new Set(results.map(function (r) { return r.style_id; }));
                    for (_i = 0, batchItems_1 = batchItems; _i < batchItems_1.length; _i++) {
                        entry = batchItems_1[_i].entry;
                        if (!resultStyleIds.has(entry.style_id)) {
                            calculationErrors.value.push({
                                style_id: entry.style_id,
                                style_code: entry.style_code,
                                error: 'Mã hàng chưa có định mức chỉ',
                            });
                        }
                    }
                    calculationProgress.value = {
                        current: batchItems.length,
                        total: batchItems.length,
                    };
                    successResults = results;
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    // Batch endpoint failed — fallback to N parallel requests
                    calculationProgress.value = { current: 0, total: batchItems.length };
                    return [4 /*yield*/, calculateAllFallback(batchItems)];
                case 4:
                    successResults = _b.sent();
                    return [3 /*break*/, 5];
                case 5:
                    perStyleResults.value = successResults;
                    calculationWarnings.value = successResults.flatMap(function (r) { return r.warnings || []; });
                    aggregateResults(successResults);
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.enrichInventory(aggregatedResults.value, currentWeekId)];
                case 7:
                    enriched = _b.sent();
                    aggregatedResults.value = enriched;
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _b.sent();
                    console.warn('[weekly-order] enrich inventory failed, using unenriched data:', err_1);
                    return [3 /*break*/, 9];
                case 9:
                    lastCalculatedAt.value = Date.now();
                    isCalculating.value = false;
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Reset all state to initial values
     */
    var clearAll = function () {
        orderEntries.value = [];
        perStyleResults.value = [];
        aggregatedResults.value = [];
        isCalculating.value = false;
        calculationProgress.value = { current: 0, total: 0 };
        calculationErrors.value = [];
        lastCalculatedAt.value = null;
        lastModifiedAt.value = null;
        deliveryDateOverrides.clear();
        orderedQuantities.value.clear();
        subArtRequired.clear();
    };
    /**
     * Populate orderEntries from saved ThreadOrderItems (for loading from history)
     */
    var setFromWeekItems = function (items) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        var entryMap = new Map();
        var _loop_1 = function (item) {
            var poId = (_a = item.po_id) !== null && _a !== void 0 ? _a : null;
            var subArtId = (_b = item.sub_art_id) !== null && _b !== void 0 ? _b : null;
            var key = entryKey(poId, item.style_id, subArtId);
            if (!entryMap.has(key)) {
                entryMap.set(key, {
                    po_id: poId,
                    po_number: ((_c = item.po) === null || _c === void 0 ? void 0 : _c.po_number) || '',
                    style_id: item.style_id,
                    style_code: ((_d = item.style) === null || _d === void 0 ? void 0 : _d.style_code) || "Style #".concat(item.style_id),
                    style_name: ((_e = item.style) === null || _e === void 0 ? void 0 : _e.style_name) || '',
                    colors: [],
                    sub_art_id: subArtId,
                    sub_art_code: (_f = item.sub_art) === null || _f === void 0 ? void 0 : _f.sub_art_code,
                });
            }
            var entry = entryMap.get(key);
            var colorKey = (_g = item.style_color_id) !== null && _g !== void 0 ? _g : item.color_id;
            var colorExists = entry.colors.some(function (c) { return c.style_color_id === colorKey || c.color_id === colorKey; });
            if (!colorExists) {
                entry.colors.push({
                    color_id: colorKey,
                    color_name: ((_h = item.style_color) === null || _h === void 0 ? void 0 : _h.color_name) || ((_j = item.color) === null || _j === void 0 ? void 0 : _j.name) || "Color #".concat(colorKey),
                    hex_code: ((_k = item.style_color) === null || _k === void 0 ? void 0 : _k.hex_code) || ((_l = item.color) === null || _l === void 0 ? void 0 : _l.hex_code) || '#000000',
                    quantity: item.quantity,
                    style_color_id: (_m = item.style_color_id) !== null && _m !== void 0 ? _m : item.color_id,
                });
            }
        };
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            _loop_1(item);
        }
        orderEntries.value = Array.from(entryMap.values());
        lastModifiedAt.value = Date.now();
        lastCalculatedAt.value = null;
    };
    var updateAdditionalOrder = function (threadTypeId, value) {
        var row = aggregatedResults.value.find(function (r) { return r.thread_type_id === threadTypeId; });
        if (!row)
            return;
        row.additional_order = value;
        row.total_final = (row.sl_can_dat || 0) + value;
    };
    /**
     * Update quota_cones for a specific thread type in aggregatedResults
     */
    var updateQuotaCones = function (threadTypeId, value) {
        var row = aggregatedResults.value.find(function (r) { return r.thread_type_id === threadTypeId; });
        if (!row)
            return;
        row.quota_cones = value;
    };
    /**
     * Update a delivery date override for a specific spec_id
     */
    var updateDeliveryDate = function (specId, date) {
        deliveryDateOverrides.set(specId, date);
    };
    /**
     * Merge delivery date overrides into perStyleResults and aggregatedResults.
     * Call before saving to persist edited dates.
     */
    var mergeDeliveryDateOverrides = function () {
        if (deliveryDateOverrides.size === 0)
            return;
        // Track thread_type_id-level overrides so summary_data can be synced before save.
        var threadTypeDeliveryOverrides = new Map();
        for (var _i = 0, _a = perStyleResults.value; _i < _a.length; _i++) {
            var result = _a[_i];
            for (var _b = 0, _c = result.calculations; _b < _c.length; _b++) {
                var calc = _c[_b];
                var override = deliveryDateOverrides.get(calc.spec_id);
                if (override) {
                    calc.delivery_date = override;
                    if (calc.color_breakdown && calc.color_breakdown.length > 0) {
                        for (var _d = 0, _e = calc.color_breakdown; _d < _e.length; _d++) {
                            var cb = _e[_d];
                            threadTypeDeliveryOverrides.set(cb.thread_type_id, override);
                        }
                    }
                    else {
                        // Fallback for non-color specs where aggregated row key currently follows spec_id.
                        threadTypeDeliveryOverrides.set(calc.spec_id, override);
                    }
                }
            }
        }
        // Also update aggregated summary rows so summary_data stays in sync with edited dates.
        for (var _f = 0, _g = aggregatedResults.value; _f < _g.length; _f++) {
            var row = _g[_f];
            var override = threadTypeDeliveryOverrides.get(row.thread_type_id);
            if (override) {
                row.delivery_date = override;
            }
        }
        deliveryDateOverrides.clear();
    };
    var fetchOrderedQuantities = function (pairs, excludeWeekId) { return __awaiter(_this, void 0, void 0, function () {
        var result, _i, result_1, info, _a, _b, entry, qtyInfo;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (pairs.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getOrderedQuantities(pairs, excludeWeekId)];
                case 1:
                    result = _c.sent();
                    for (_i = 0, result_1 = result; _i < result_1.length; _i++) {
                        info = result_1[_i];
                        orderedQuantities.value.set("".concat(info.po_id, "_").concat(info.style_id), info);
                    }
                    for (_a = 0, _b = orderEntries.value; _a < _b.length; _a++) {
                        entry = _b[_a];
                        if (!entry.po_id)
                            continue;
                        qtyInfo = orderedQuantities.value.get("".concat(entry.po_id, "_").concat(entry.style_id));
                        if (qtyInfo) {
                            entry.po_quantity = qtyInfo.po_quantity;
                            entry.already_ordered = qtyInfo.ordered_quantity;
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update perStyleResults with reordered results from drag-and-drop
     * Then recalculate to get updated inventory preview
     */
    var reorderResults = function (newOrder) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isReordering.value = true;
                    perStyleResults.value = newOrder;
                    aggregateResults(newOrder);
                    // Recalculate with new order to update inventory allocation preview
                    return [4 /*yield*/, calculateAll()];
                case 1:
                    // Recalculate with new order to update inventory allocation preview
                    _a.sent();
                    isReordering.value = false;
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        // State
        orderEntries: orderEntries,
        perStyleResults: perStyleResults,
        aggregatedResults: aggregatedResults,
        isCalculating: isCalculating,
        isReordering: isReordering,
        calculationProgress: calculationProgress,
        calculationErrors: calculationErrors,
        calculationWarnings: calculationWarnings,
        lastCalculatedAt: lastCalculatedAt,
        lastModifiedAt: lastModifiedAt,
        deliveryDateOverrides: deliveryDateOverrides,
        orderedQuantities: orderedQuantities,
        subArtRequired: subArtRequired,
        // Computed
        canCalculate: canCalculate,
        canCalculateReason: canCalculateReason,
        hasResults: hasResults,
        isResultsStale: isResultsStale,
        hasOverLimitEntries: hasOverLimitEntries,
        subArtMissing: subArtMissing,
        // Actions
        addStyle: addStyle,
        removeStyle: removeStyle,
        removePO: removePO,
        updateSubArt: updateSubArt,
        addColorToStyle: addColorToStyle,
        removeColorFromStyle: removeColorFromStyle,
        updateColorQuantity: updateColorQuantity,
        calculateAll: calculateAll,
        aggregateResults: aggregateResults,
        updateAdditionalOrder: updateAdditionalOrder,
        updateQuotaCones: updateQuotaCones,
        updateDeliveryDate: updateDeliveryDate,
        mergeDeliveryDateOverrides: mergeDeliveryDateOverrides,
        reorderResults: reorderResults,
        fetchOrderedQuantities: fetchOrderedQuantities,
        clearAll: clearAll,
        setFromWeekItems: setFromWeekItems,
    };
}
