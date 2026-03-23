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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var core_1 = require("@vueuse/core");
var useIssueV2_1 = require("@/composables/thread/useIssueV2");
var issueV2Service_1 = require("@/services/issueV2Service");
var subArtService_1 = require("@/services/subArtService");
var employeeService_1 = require("@/services/employeeService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var useAuth_1 = require("@/composables/useAuth");
var useConfirm_1 = require("@/composables/useConfirm");
var issueV2_1 = require("@/types/thread/issueV2");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var DataTable_vue_1 = require("@/components/ui/tables/DataTable.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var utils_1 = require("@/utils");
var IssueV2StatusBadge_vue_1 = require("@/components/thread/IssueV2StatusBadge.vue");
var route = (0, vue_router_1.useRoute)();
var router = (0, vue_router_1.useRouter)();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var employee = (0, useAuth_1.useAuth)().employee;
var _z = (0, useConfirm_1.useConfirm)(), confirmWarning = _z.confirmWarning, confirmDelete = _z.confirmDelete;
var _0 = (0, useIssueV2_1.useIssueV2)(), currentIssue = _0.currentIssue, isLoading = _0.isLoading, hasIssue = _0.hasIssue, lines = _0.lines, threadTypes = _0.threadTypes, isConfirmed = _0.isConfirmed, issues = _0.issues, total = _0.total, filters = _0.filters, createIssueWithFirstLine = _0.createIssueWithFirstLine, fetchIssue = _0.fetchIssue, loadFormData = _0.loadFormData, validateLine = _0.validateLine, addLine = _0.addLine, removeLine = _0.removeLine, confirmIssue = _0.confirmIssue, clearIssue = _0.clearIssue, fetchIssues = _0.fetchIssues;
var activeTab = (0, vue_1.ref)(route.query.tab === 'history' ? 'history' : 'create');
var step2Visible = (0, vue_1.ref)(false);
var department = (0, vue_1.ref)('');
var createdBy = (0, vue_1.ref)((_b = (_a = employee.value) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : '');
var selectedPoId = (0, vue_1.ref)(null);
var selectedStyleId = (0, vue_1.ref)(null);
var selectedSubArtId = (0, vue_1.ref)(null);
var selectedColorId = (0, vue_1.ref)(null);
var poOptions = (0, vue_1.ref)([]);
var styleOptions = (0, vue_1.ref)([]);
var subArtOptions = (0, vue_1.ref)([]);
var colorOptions = (0, vue_1.ref)([]);
var departmentOptions = (0, vue_1.ref)([]);
var loadingOptions = (0, vue_1.ref)(false);
var loadingFormData = (0, vue_1.ref)(false);
var loadingSubArts = (0, vue_1.ref)(false);
var selectedStyleHasSubArts = (0, vue_1.computed)(function () {
    var _a;
    if (!selectedStyleId.value)
        return false;
    var opt = styleOptions.value.find(function (s) { return s.value === selectedStyleId.value; });
    return (_a = opt === null || opt === void 0 ? void 0 : opt.has_sub_arts) !== null && _a !== void 0 ? _a : false;
});
var lineInputs = (0, vue_1.ref)({});
var canCreateIssue = (0, vue_1.computed)(function () {
    return department.value.trim() && createdBy.value.trim() && !hasIssue.value && !step2Visible.value;
});
var canLoadThreadTypes = (0, vue_1.computed)(function () {
    if (!selectedPoId.value || !selectedStyleId.value || !selectedColorId.value)
        return false;
    if (selectedStyleHasSubArts.value && !selectedSubArtId.value)
        return false;
    return true;
});
var canConfirm = (0, vue_1.computed)(function () {
    if (!hasIssue.value || isConfirmed.value)
        return false;
    var hasLines = lines.value.length > 0;
    var allOverQuotaHaveNotes = lines.value
        .filter(function (line) { return line.is_over_quota; })
        .every(function (line) { var _a; return (_a = line.over_quota_notes) === null || _a === void 0 ? void 0 : _a.trim(); });
    return hasLines && allOverQuotaHaveNotes;
});
var availableThreadTypes = (0, vue_1.computed)(function () {
    var addedThreadTypeIds = new Set(lines.value.map(function (line) { return line.thread_type_id; }));
    return threadTypes.value.filter(function (tt) { return !addedThreadTypeIds.has(tt.thread_type_id); });
});
var columns = [
    { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
    { name: 'quota', label: 'Định Mức Cấp', field: 'quota_cones', align: 'center' },
    { name: 'stock', label: 'Tồn Kho', field: 'stock', align: 'center' },
    { name: 'issue', label: 'Xuất', field: 'issue', align: 'center' },
    { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
];
var historyLoaded = (0, vue_1.ref)(false);
var localFilters = (0, vue_1.ref)({
    status: undefined,
    from: undefined,
    to: undefined,
    page: 1,
    limit: 20,
});
var historyPagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 20,
    rowsNumber: 0,
});
var statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Nháp', value: issueV2_1.IssueV2Status.DRAFT },
    { label: 'Đã xác nhận', value: issueV2_1.IssueV2Status.CONFIRMED },
    { label: 'Đã nhập lại', value: issueV2_1.IssueV2Status.RETURNED },
];
var historyColumns = [
    { name: 'issue_code', label: 'Mã Phiếu', field: 'issue_code', align: 'left', sortable: true },
    { name: 'department', label: 'Bộ Phận', field: 'department', align: 'left', sortable: true },
    { name: 'line_count', label: 'Số Dòng', field: 'line_count', align: 'center' },
    { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
    { name: 'created_at', label: 'Ngày Tạo', field: 'created_at', align: 'left', sortable: true },
    { name: 'created_by', label: 'Người Tạo', field: 'created_by', align: 'left' },
    { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'center', sortable: false },
];
var addedLinesColumns = [
    { name: 'thread', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
    { name: 'po', label: 'PO', field: 'po_number', align: 'left' },
    { name: 'style', label: 'Mã Hàng', field: 'style_code', align: 'left' },
    { name: 'sub_art', label: 'Sub-Art', field: 'sub_art_code', align: 'left', format: function (v) { return v || '-'; } },
    { name: 'color', label: 'Màu', field: 'color_name', align: 'left' },
    { name: 'quota', label: 'Định Mức Cấp', field: 'quota_cones', align: 'center', format: function (v) { return v !== null ? "".concat(v) : '-'; } },
    { name: 'issued', label: 'Xuất', field: 'issued', align: 'center' },
    { name: 'equivalent', label: 'Quy Đổi', field: 'issued_equivalent', align: 'center', format: function (v) { return v.toFixed(2); } },
    { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
];
function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    var date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
}
(0, vue_1.watch)(selectedPoId, function (newPoId) { return __awaiter(void 0, void 0, void 0, function () {
    var styles, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                selectedStyleId.value = null;
                selectedSubArtId.value = null;
                selectedColorId.value = null;
                styleOptions.value = [];
                subArtOptions.value = [];
                colorOptions.value = [];
                if (!newPoId)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, issueV2Service_1.issueV2Service.getOrderOptions(newPoId)];
            case 2:
                styles = _a.sent();
                styleOptions.value = styles.map(function (s) { return ({
                    value: s.id,
                    label: "".concat(s.style_code, " - ").concat(s.style_name || '').trim(),
                    has_sub_arts: s.has_sub_arts,
                }); });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.error('Failed to load styles:', err_1);
                snackbar.error('Không thể tải danh sách mã hàng');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.watch)(selectedStyleId, function (newStyleId) { return __awaiter(void 0, void 0, void 0, function () {
    var subArts, err_2, colors, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                selectedSubArtId.value = null;
                selectedColorId.value = null;
                subArtOptions.value = [];
                colorOptions.value = [];
                if (!newStyleId || !selectedPoId.value)
                    return [2 /*return*/];
                if (!selectedStyleHasSubArts.value) return [3 /*break*/, 5];
                loadingSubArts.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, subArtService_1.subArtService.getByStyleId(newStyleId)];
            case 2:
                subArts = _a.sent();
                subArtOptions.value = subArts.map(function (sa) { return ({
                    value: sa.id,
                    label: sa.sub_art_code,
                }); });
                return [3 /*break*/, 5];
            case 3:
                err_2 = _a.sent();
                console.error('Failed to load sub-arts:', err_2);
                snackbar.error('Không thể tải danh sách Sub-Art');
                return [3 /*break*/, 5];
            case 4:
                loadingSubArts.value = false;
                return [7 /*endfinally*/];
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, issueV2Service_1.issueV2Service.getOrderOptions(selectedPoId.value, newStyleId)];
            case 6:
                colors = _a.sent();
                colorOptions.value = colors.map(function (c) { return ({
                    value: c.id,
                    label: c.name,
                }); });
                return [3 /*break*/, 8];
            case 7:
                err_3 = _a.sent();
                console.error('Failed to load colors:', err_3);
                snackbar.error('Không thể tải danh sách màu');
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.watch)([selectedPoId, selectedStyleId, selectedSubArtId, selectedColorId], function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var poId = _b[0], styleId = _b[1], _subArtId = _b[2], colorId = _b[3];
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!(poId && styleId && colorId && canLoadThreadTypes.value)) return [3 /*break*/, 2];
                return [4 /*yield*/, handleLoadFormData()];
            case 1:
                _c.sent();
                _c.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.watch)(activeTab, function (newTab) {
    if (newTab === 'history' && !historyLoaded.value) {
        historyLoaded.value = true;
        loadHistoryData();
    }
});
function loadInitialOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var pos, depts, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loadingOptions.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, issueV2Service_1.issueV2Service.getOrderOptions()];
                case 2:
                    pos = _a.sent();
                    poOptions.value = pos.map(function (po) { return ({
                        value: po.id,
                        label: po.po_number,
                    }); });
                    return [4 /*yield*/, employeeService_1.employeeService.getDepartments()];
                case 3:
                    depts = _a.sent();
                    departmentOptions.value = depts.map(function (d) { return ({ value: d, label: d }); });
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _a.sent();
                    console.error('Failed to load options:', err_4);
                    snackbar.error('Không thể tải dữ liệu');
                    return [3 /*break*/, 6];
                case 5:
                    loadingOptions.value = false;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleCreateIssue() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!canCreateIssue.value)
                return [2 /*return*/];
            step2Visible.value = true;
            return [2 /*return*/];
        });
    });
}
function handleLoadFormData() {
    return __awaiter(this, void 0, void 0, function () {
        var data, _i, _a, tt;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!canLoadThreadTypes.value)
                        return [2 /*return*/];
                    loadingFormData.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, loadFormData(selectedPoId.value, selectedStyleId.value, selectedColorId.value)];
                case 2:
                    data = _b.sent();
                    lineInputs.value = {};
                    if (data === null || data === void 0 ? void 0 : data.thread_types) {
                        for (_i = 0, _a = data.thread_types; _i < _a.length; _i++) {
                            tt = _a[_i];
                            lineInputs.value[tt.thread_type_id] = {
                                full: 0,
                                partial: 0,
                                notes: '',
                                validation: null,
                            };
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    loadingFormData.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var debouncedValidate = (0, core_1.useDebounceFn)(function (threadTypeId) { return __awaiter(void 0, void 0, void 0, function () {
    var input, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                input = lineInputs.value[threadTypeId];
                if (!input)
                    return [2 /*return*/];
                if (input.full === 0 && input.partial === 0) {
                    input.validation = null;
                    return [2 /*return*/];
                }
                return [4 /*yield*/, validateLine({
                        thread_type_id: threadTypeId,
                        issued_full: input.full,
                        issued_partial: input.partial,
                        po_id: selectedPoId.value,
                        style_id: selectedStyleId.value,
                        color_id: selectedColorId.value,
                        style_color_id: selectedColorId.value,
                        sub_art_id: selectedSubArtId.value,
                    })];
            case 1:
                result = _a.sent();
                if (result) {
                    input.validation = result;
                }
                return [2 /*return*/];
        }
    });
}); }, 300);
function handleQuantityChange(threadTypeId) {
    debouncedValidate(threadTypeId);
}
function handleInputChange(threadTypeId, field, value, max) {
    var input = lineInputs.value[threadTypeId];
    if (!input)
        return;
    var clampedValue = Math.min(Math.max(0, value), max);
    input[field] = clampedValue;
    handleQuantityChange(threadTypeId);
}
function getLineUnderQuotaAmount(line) {
    if (!line.quota_cones)
        return 0;
    var remaining = line.quota_cones - line.issued_equivalent;
    return remaining > 0 ? remaining : 0;
}
function getUnderQuotaAmount(threadType) {
    var input = lineInputs.value[threadType.thread_type_id];
    if (!input || !threadType.quota_cones)
        return 0;
    var validation = input.validation;
    if (!validation) {
        if (input.full === 0 && input.partial === 0) {
            return threadType.quota_cones;
        }
        return 0;
    }
    if (validation.is_over_quota)
        return 0;
    var remaining = threadType.quota_cones - validation.issued_equivalent;
    return remaining > 0 ? remaining : 0;
}
function isAddButtonDisabled(threadTypeId) {
    var input = lineInputs.value[threadTypeId];
    if (!input)
        return true;
    if (input.full === 0 && input.partial === 0)
        return true;
    if (input.validation && !input.validation.stock_sufficient)
        return true;
    return false;
}
function getAddButtonTooltip(threadTypeId) {
    var input = lineInputs.value[threadTypeId];
    if (!input)
        return 'Nhập số lượng xuất';
    if (input.full === 0 && input.partial === 0) {
        return 'Nhập số lượng xuất';
    }
    if (input.validation && !input.validation.stock_sufficient) {
        return 'Không đủ tồn kho';
    }
    return 'Thêm vào phiếu';
}
function handleAddLine(threadType) {
    return __awaiter(this, void 0, void 0, function () {
        var input, result_1, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    input = lineInputs.value[threadType.thread_type_id];
                    if (!input || (input.full === 0 && input.partial === 0)) {
                        snackbar.warning('Nhập số lượng xuất');
                        return [2 /*return*/];
                    }
                    if (input.validation && !input.validation.stock_sufficient) {
                        snackbar.error('Không đủ tồn kho để xuất');
                        return [2 /*return*/];
                    }
                    if (((_a = input.validation) === null || _a === void 0 ? void 0 : _a.is_over_quota) && !input.notes.trim()) {
                        snackbar.warning('Vượt định mức, yêu cầu ghi chú lý do');
                        return [2 /*return*/];
                    }
                    if (!!hasIssue.value) return [3 /*break*/, 2];
                    return [4 /*yield*/, createIssueWithFirstLine({
                            department: department.value.trim(),
                            created_by: createdBy.value.trim(),
                            po_id: selectedPoId.value,
                            style_id: selectedStyleId.value,
                            color_id: selectedColorId.value,
                            style_color_id: selectedColorId.value,
                            sub_art_id: selectedSubArtId.value,
                            thread_type_id: threadType.thread_type_id,
                            issued_full: input.full,
                            issued_partial: input.partial,
                            over_quota_notes: input.notes.trim() || null,
                        })];
                case 1:
                    result_1 = _b.sent();
                    if (result_1) {
                        input.full = 0;
                        input.partial = 0;
                        input.notes = '';
                        input.validation = null;
                    }
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, addLine({
                        po_id: selectedPoId.value,
                        style_id: selectedStyleId.value,
                        color_id: selectedColorId.value,
                        style_color_id: selectedColorId.value,
                        sub_art_id: selectedSubArtId.value,
                        thread_type_id: threadType.thread_type_id,
                        issued_full: input.full,
                        issued_partial: input.partial,
                        over_quota_notes: input.notes.trim() || null,
                    })];
                case 3:
                    result = _b.sent();
                    if (result) {
                        input.full = 0;
                        input.partial = 0;
                        input.notes = '';
                        input.validation = null;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleRemoveLine(lineId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, removeLine(lineId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleConfirm() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!canConfirm.value)
                        return [2 /*return*/];
                    return [4 /*yield*/, confirmIssue()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleBack() {
    clearIssue();
    router.push('/thread/issues');
}
function handleNewIssue() {
    var _a, _b;
    clearIssue();
    step2Visible.value = false;
    department.value = '';
    createdBy.value = (_b = (_a = employee.value) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : '';
    selectedPoId.value = null;
    selectedStyleId.value = null;
    selectedSubArtId.value = null;
    selectedColorId.value = null;
    subArtOptions.value = [];
    lineInputs.value = {};
}
function getRowClass(line) {
    return line.is_over_quota ? 'bg-warning-1' : '';
}
var loadHistoryData = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filters.value = __assign({}, localFilters.value);
                return [4 /*yield*/, fetchIssues()];
            case 1:
                _a.sent();
                historyPagination.value.rowsNumber = total.value;
                return [2 /*return*/];
        }
    });
}); };
var handleHistoryRequest = function (props) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                localFilters.value.page = props.pagination.page;
                localFilters.value.limit = props.pagination.rowsPerPage;
                historyPagination.value.page = props.pagination.page;
                historyPagination.value.rowsPerPage = props.pagination.rowsPerPage;
                return [4 /*yield*/, loadHistoryData()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleHistorySearch = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                localFilters.value.page = 1;
                historyPagination.value.page = 1;
                return [4 /*yield*/, loadHistoryData()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleClearHistoryFilters = function () {
    localFilters.value = {
        status: undefined,
        from: undefined,
        to: undefined,
        page: 1,
        limit: 20,
    };
    handleHistorySearch();
};
var handleHistoryRowClick = function (evt, row) {
    if (row.status === issueV2_1.IssueV2Status.DRAFT) {
        router.push("/thread/issues/v2?tab=create&issue=".concat(row.id));
    }
    else {
        router.push("/thread/issues/v2/".concat(row.id));
    }
};
var handleConfirmFromList = function (issue) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, confirmWarning('Phiếu sẽ được xác nhận và trừ tồn kho. Bạn có chắc chắn?', 'Xác nhận phiếu xuất')];
            case 1:
                confirmed = _a.sent();
                if (!confirmed)
                    return [2 /*return*/];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 5, , 6]);
                return [4 /*yield*/, issueV2Service_1.issueV2Service.confirm(issue.id)];
            case 3:
                _a.sent();
                snackbar.success('Xác nhận phiếu xuất thành công');
                return [4 /*yield*/, fetchIssues()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                err_5 = _a.sent();
                snackbar.error(err_5 instanceof Error ? err_5.message : 'Không thể xác nhận phiếu xuất');
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
var handleDeleteFromList = function (issue) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, confirmDelete(issue.issue_code)];
            case 1:
                confirmed = _a.sent();
                if (!confirmed)
                    return [2 /*return*/];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 5, , 6]);
                return [4 /*yield*/, issueV2Service_1.issueV2Service.deleteIssue(issue.id)];
            case 3:
                _a.sent();
                snackbar.success('Xóa phiếu xuất thành công');
                return [4 /*yield*/, fetchIssues()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                err_6 = _a.sent();
                snackbar.error(err_6 instanceof Error ? err_6.message : 'Không thể xóa phiếu xuất');
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
var handleReturnFromList = function () {
    router.push('/thread/issues/v2/return');
};
var loadDraftFromQuery = function (issueParam) { return __awaiter(void 0, void 0, void 0, function () {
    var issueId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!issueParam)
                    return [2 /*return*/, false];
                issueId = Number(issueParam);
                if (isNaN(issueId))
                    return [2 /*return*/, false];
                return [4 /*yield*/, fetchIssue(issueId)];
            case 1:
                _a.sent();
                if (currentIssue.value && currentIssue.value.status === issueV2_1.IssueV2Status.DRAFT) {
                    activeTab.value = 'create';
                    step2Visible.value = true;
                    department.value = currentIssue.value.department || '';
                    createdBy.value = currentIssue.value.created_by || '';
                    router.replace({ query: { tab: 'create' } });
                    return [2 /*return*/, true];
                }
                else {
                    router.replace("/thread/issues/v2/".concat(issueId));
                    return [2 /*return*/, true];
                }
                return [2 /*return*/];
        }
    });
}); };
(0, vue_1.watch)(function () { return route.query.issue; }, function (newIssue, oldIssue) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(newIssue && newIssue !== oldIssue)) return [3 /*break*/, 2];
                return [4 /*yield*/, loadDraftFromQuery(newIssue)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var loaded;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                loadInitialOptions();
                return [4 /*yield*/, loadDraftFromQuery(route.query.issue)];
            case 1:
                loaded = _a.sent();
                if (loaded)
                    return [2 /*return*/];
                if (activeTab.value === 'history') {
                    historyLoaded.value = true;
                    loadHistoryData();
                }
                return [2 /*return*/];
        }
    });
}); });
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['q-table']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-caption text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    flat: true,
    bordered: true,
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary" }), { align: "left", activeColor: "primary", indicatorColor: "primary" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary" }), { align: "left", activeColor: "primary", indicatorColor: "primary" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_18 = __VLS_16.slots.default;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    name: "create",
    label: "Tạo Phiếu Xuất",
    icon: "o_add_circle",
}));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
        name: "create",
        label: "Tạo Phiếu Xuất",
        icon: "o_add_circle",
    }], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    name: "history",
    label: "Lịch Sử",
    icon: "o_history",
}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
        name: "history",
        label: "Lịch Sử",
        icon: "o_history",
    }], __VLS_functionalComponentArgsRest(__VLS_25), false));
// @ts-ignore
[activeTab,];
var __VLS_16;
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_30), false));
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    modelValue: (__VLS_ctx.activeTab),
    animated: true,
}));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
    }], __VLS_functionalComponentArgsRest(__VLS_35), false));
var __VLS_39 = __VLS_37.slots.default;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    name: "create",
}));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
        name: "create",
    }], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45 = __VLS_43.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_46 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46(__assign({ 'onClick': {} }, { icon: "arrow_back", variant: "flat", round: true })));
var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "arrow_back", variant: "flat", round: true })], __VLS_functionalComponentArgsRest(__VLS_47), false));
var __VLS_51;
var __VLS_52 = ({ click: {} },
    { onClick: (__VLS_ctx.handleBack) });
var __VLS_49;
var __VLS_50;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-ma-none q-ml-sm" }));
/** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
var __VLS_53;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({}));
var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_54), false));
if (__VLS_ctx.isConfirmed) {
    var __VLS_58 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign(__assign({ 'onClick': {} }, { label: "Tạo Phiếu Mới", color: "primary", icon: "add" }), { class: "q-ml-sm" })));
    var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Tạo Phiếu Mới", color: "primary", icon: "add" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_59), false));
    var __VLS_63 = void 0;
    var __VLS_64 = ({ click: {} },
        { onClick: (__VLS_ctx.handleNewIssue) });
    /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    var __VLS_61;
    var __VLS_62;
}
if (__VLS_ctx.hasIssue && __VLS_ctx.currentIssue) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ color: (__VLS_ctx.isConfirmed ? 'positive' : 'grey') }, { class: "text-subtitle1 q-pa-sm" })));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.isConfirmed ? 'positive' : 'grey') }, { class: "text-subtitle1 q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_66), false));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_70 = __VLS_68.slots.default;
    (__VLS_ctx.currentIssue.issue_code);
    if (__VLS_ctx.isConfirmed) {
        var __VLS_71 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign({ dense: true, color: "white", textColor: "positive" }, { class: "q-ml-sm" })));
        var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign({ dense: true, color: "white", textColor: "positive" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_72), false));
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        var __VLS_76 = __VLS_74.slots.default;
        // @ts-ignore
        [activeTab, handleBack, isConfirmed, isConfirmed, isConfirmed, handleNewIssue, hasIssue, currentIssue, currentIssue,];
        var __VLS_74;
    }
    // @ts-ignore
    [];
    var __VLS_68;
}
if (!__VLS_ctx.hasIssue && !__VLS_ctx.step2Visible) {
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_82 = __VLS_80.slots.default;
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({}));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = __VLS_86.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_89 = AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        modelValue: (__VLS_ctx.department),
        label: "Bộ Phận",
        options: (__VLS_ctx.departmentOptions),
        loading: (__VLS_ctx.loadingOptions),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        placeholder: "Chọn bộ phận...",
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.department),
            label: "Bộ Phận",
            options: (__VLS_ctx.departmentOptions),
            loading: (__VLS_ctx.loadingOptions),
            required: true,
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            placeholder: "Chọn bộ phận...",
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_94 = AppInput_vue_1.default;
    // @ts-ignore
    var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
        modelValue: (__VLS_ctx.createdBy),
        label: "Người Tạo",
        required: true,
        readonly: true,
    }));
    var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.createdBy),
            label: "Người Tạo",
            required: true,
            readonly: true,
        }], __VLS_functionalComponentArgsRest(__VLS_95), false));
    // @ts-ignore
    [hasIssue, step2Visible, department, departmentOptions, loadingOptions, createdBy,];
    var __VLS_86;
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
        align: "right",
    }));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = __VLS_102.slots.default;
    var __VLS_105 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onClick': {} }, { label: "Tiếp Tục", color: "primary", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canCreateIssue) })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tiếp Tục", color: "primary", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canCreateIssue) })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    var __VLS_110 = void 0;
    var __VLS_111 = ({ click: {} },
        { onClick: (__VLS_ctx.handleCreateIssue) });
    var __VLS_108;
    var __VLS_109;
    // @ts-ignore
    [isLoading, canCreateIssue, handleCreateIssue,];
    var __VLS_102;
    // @ts-ignore
    [];
    var __VLS_80;
}
if ((__VLS_ctx.step2Visible || __VLS_ctx.hasIssue) && !__VLS_ctx.isConfirmed) {
    var __VLS_112 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_113), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_117 = __VLS_115.slots.default;
    var __VLS_118 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({}));
    var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_119), false));
    var __VLS_123 = __VLS_121.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_124 = AppSelect_vue_1.default || AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
        modelValue: (__VLS_ctx.selectedPoId),
        label: "PO",
        options: (__VLS_ctx.poOptions),
        loading: (__VLS_ctx.loadingOptions),
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        placeholder: "Chọn đơn hàng...",
    }));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedPoId),
            label: "PO",
            options: (__VLS_ctx.poOptions),
            loading: (__VLS_ctx.loadingOptions),
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            placeholder: "Chọn đơn hàng...",
        }], __VLS_functionalComponentArgsRest(__VLS_125), false));
    var __VLS_129 = __VLS_127.slots.default;
    {
        var __VLS_130 = __VLS_127.slots["no-option"];
        var __VLS_131 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({}));
        var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_132), false));
        var __VLS_136 = __VLS_134.slots.default;
        var __VLS_137 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ class: "text-grey" })));
        var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_142 = __VLS_140.slots.default;
        // @ts-ignore
        [isConfirmed, hasIssue, step2Visible, loadingOptions, selectedPoId, poOptions,];
        var __VLS_140;
        // @ts-ignore
        [];
        var __VLS_134;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_127;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_143 = AppSelect_vue_1.default || AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        modelValue: (__VLS_ctx.selectedStyleId),
        label: "Mã Hàng (Style)",
        options: (__VLS_ctx.styleOptions),
        disable: (!__VLS_ctx.selectedPoId),
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        placeholder: "Chọn mã hàng...",
    }));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedStyleId),
            label: "Mã Hàng (Style)",
            options: (__VLS_ctx.styleOptions),
            disable: (!__VLS_ctx.selectedPoId),
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            placeholder: "Chọn mã hàng...",
        }], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = __VLS_146.slots.default;
    {
        var __VLS_149 = __VLS_146.slots["no-option"];
        var __VLS_150 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({}));
        var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_151), false));
        var __VLS_155 = __VLS_153.slots.default;
        var __VLS_156 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156(__assign({ class: "text-grey" })));
        var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_157), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_161 = __VLS_159.slots.default;
        // @ts-ignore
        [selectedPoId, selectedStyleId, styleOptions,];
        var __VLS_159;
        // @ts-ignore
        [];
        var __VLS_153;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_146;
    if (__VLS_ctx.selectedStyleHasSubArts) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
        var __VLS_162 = AppSelect_vue_1.default || AppSelect_vue_1.default;
        // @ts-ignore
        var __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162({
            modelValue: (__VLS_ctx.selectedSubArtId),
            label: "Sub-Art",
            options: (__VLS_ctx.subArtOptions),
            disable: (!__VLS_ctx.selectedStyleId),
            loading: (__VLS_ctx.loadingSubArts),
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            placeholder: "Chọn Sub-Art...",
        }));
        var __VLS_164 = __VLS_163.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.selectedSubArtId),
                label: "Sub-Art",
                options: (__VLS_ctx.subArtOptions),
                disable: (!__VLS_ctx.selectedStyleId),
                loading: (__VLS_ctx.loadingSubArts),
                emitValue: true,
                mapOptions: true,
                useInput: true,
                fillInput: true,
                hideSelected: true,
                placeholder: "Chọn Sub-Art...",
            }], __VLS_functionalComponentArgsRest(__VLS_163), false));
        var __VLS_167 = __VLS_165.slots.default;
        {
            var __VLS_168 = __VLS_165.slots["no-option"];
            var __VLS_169 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
            qItem;
            // @ts-ignore
            var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({}));
            var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_170), false));
            var __VLS_174 = __VLS_172.slots.default;
            var __VLS_175 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175(__assign({ class: "text-grey" })));
            var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_176), false));
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            var __VLS_180 = __VLS_178.slots.default;
            // @ts-ignore
            [selectedStyleId, selectedStyleHasSubArts, selectedSubArtId, subArtOptions, loadingSubArts,];
            var __VLS_178;
            // @ts-ignore
            [];
            var __VLS_172;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_165;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_181 = AppSelect_vue_1.default || AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181({
        modelValue: (__VLS_ctx.selectedColorId),
        label: "Màu",
        options: (__VLS_ctx.colorOptions),
        disable: (!__VLS_ctx.selectedStyleId || (__VLS_ctx.selectedStyleHasSubArts && !__VLS_ctx.selectedSubArtId)),
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        placeholder: "Chọn màu...",
    }));
    var __VLS_183 = __VLS_182.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedColorId),
            label: "Màu",
            options: (__VLS_ctx.colorOptions),
            disable: (!__VLS_ctx.selectedStyleId || (__VLS_ctx.selectedStyleHasSubArts && !__VLS_ctx.selectedSubArtId)),
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            placeholder: "Chọn màu...",
        }], __VLS_functionalComponentArgsRest(__VLS_182), false));
    var __VLS_186 = __VLS_184.slots.default;
    {
        var __VLS_187 = __VLS_184.slots["no-option"];
        var __VLS_188 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({}));
        var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_189), false));
        var __VLS_193 = __VLS_191.slots.default;
        var __VLS_194 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194(__assign({ class: "text-grey" })));
        var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_195), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_199 = __VLS_197.slots.default;
        // @ts-ignore
        [selectedStyleId, selectedStyleHasSubArts, selectedSubArtId, selectedColorId, colorOptions,];
        var __VLS_197;
        // @ts-ignore
        [];
        var __VLS_191;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_184;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_200 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200(__assign({ 'onClick': {} }, { label: "Tải Chỉ", color: "secondary", icon: "refresh", loading: (__VLS_ctx.loadingFormData), disable: (!__VLS_ctx.canLoadThreadTypes) })));
    var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tải Chỉ", color: "secondary", icon: "refresh", loading: (__VLS_ctx.loadingFormData), disable: (!__VLS_ctx.canLoadThreadTypes) })], __VLS_functionalComponentArgsRest(__VLS_201), false));
    var __VLS_205 = void 0;
    var __VLS_206 = ({ click: {} },
        { onClick: (__VLS_ctx.handleLoadFormData) });
    var __VLS_203;
    var __VLS_204;
    // @ts-ignore
    [loadingFormData, canLoadThreadTypes, handleLoadFormData,];
    var __VLS_121;
    // @ts-ignore
    [];
    var __VLS_115;
}
if ((__VLS_ctx.step2Visible || __VLS_ctx.hasIssue) && __VLS_ctx.availableThreadTypes.length > 0 && !__VLS_ctx.isConfirmed) {
    var __VLS_207 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
    var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_208), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_212 = __VLS_210.slots.default;
    var __VLS_213 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213({}));
    var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_214), false));
    var __VLS_218 = __VLS_216.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_219 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_220 = __VLS_asFunctionalComponent1(__VLS_219, new __VLS_219({
        rows: (__VLS_ctx.availableThreadTypes),
        columns: (__VLS_ctx.columns),
        rowKey: "thread_type_id",
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 0 }),
        hideBottom: true,
    }));
    var __VLS_221 = __VLS_220.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.availableThreadTypes),
            columns: (__VLS_ctx.columns),
            rowKey: "thread_type_id",
            flat: true,
            bordered: true,
            pagination: ({ rowsPerPage: 0 }),
            hideBottom: true,
        }], __VLS_functionalComponentArgsRest(__VLS_220), false));
    var __VLS_224 = __VLS_222.slots.default;
    {
        var __VLS_225 = __VLS_222.slots["body-cell-thread"];
        var props = __VLS_vSlot(__VLS_225)[0];
        var __VLS_226 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226({
            props: (props),
        }));
        var __VLS_228 = __VLS_227.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_227), false));
        var __VLS_231 = __VLS_229.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.thread_code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        (props.row.thread_name);
        // @ts-ignore
        [isConfirmed, hasIssue, step2Visible, availableThreadTypes, availableThreadTypes, columns,];
        var __VLS_229;
        // @ts-ignore
        [];
    }
    {
        var __VLS_232 = __VLS_222.slots["body-cell-quota"];
        var props = __VLS_vSlot(__VLS_232)[0];
        var __VLS_233 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_234 = __VLS_asFunctionalComponent1(__VLS_233, new __VLS_233({
            props: (props),
        }));
        var __VLS_235 = __VLS_234.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_234), false));
        var __VLS_238 = __VLS_236.slots.default;
        if (props.row.base_quota_cones !== null) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            (props.row.confirmed_issued_gross);
            (props.row.base_quota_cones);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            (props.row.quota_cones);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        // @ts-ignore
        [];
        var __VLS_236;
        // @ts-ignore
        [];
    }
    {
        var __VLS_239 = __VLS_222.slots["body-cell-stock"];
        var props = __VLS_vSlot(__VLS_239)[0];
        var __VLS_240 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
            props: (props),
        }));
        var __VLS_242 = __VLS_241.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_241), false));
        var __VLS_245 = __VLS_243.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-positive" }));
        /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
        (props.row.stock_available_full);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-warning" }));
        /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
        (props.row.stock_available_partial);
        // @ts-ignore
        [];
        var __VLS_243;
        // @ts-ignore
        [];
    }
    {
        var __VLS_246 = __VLS_222.slots["body-cell-issue"];
        var props_1 = __VLS_vSlot(__VLS_246)[0];
        var __VLS_247 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247({
            props: (props_1),
        }));
        var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([{
                props: (props_1),
            }], __VLS_functionalComponentArgsRest(__VLS_248), false));
        var __VLS_252 = __VLS_250.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-xs items-center no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        var __VLS_253 = AppInput_vue_1.default;
        // @ts-ignore
        var __VLS_254 = __VLS_asFunctionalComponent1(__VLS_253, new __VLS_253(__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_d = (_c = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _c === void 0 ? void 0 : _c.full) !== null && _d !== void 0 ? _d : 0), type: "number", dense: true }), { class: "col" }), { style: {} }), { min: (0), max: (props_1.row.stock_available_full), placeholder: "Nguyên" })));
        var __VLS_255 = __VLS_254.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_f = (_e = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _e === void 0 ? void 0 : _e.full) !== null && _f !== void 0 ? _f : 0), type: "number", dense: true }), { class: "col" }), { style: {} }), { min: (0), max: (props_1.row.stock_available_full), placeholder: "Nguyên" })], __VLS_functionalComponentArgsRest(__VLS_254), false));
        var __VLS_258 = void 0;
        var __VLS_259 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': (function (v) { return __VLS_ctx.handleInputChange(props_1.row.thread_type_id, 'full', Number(v) || 0, props_1.row.stock_available_full); }) });
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_256;
        var __VLS_257;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        var __VLS_260 = AppInput_vue_1.default;
        // @ts-ignore
        var __VLS_261 = __VLS_asFunctionalComponent1(__VLS_260, new __VLS_260(__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_h = (_g = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _g === void 0 ? void 0 : _g.partial) !== null && _h !== void 0 ? _h : 0), type: "number", dense: true }), { class: "col" }), { style: {} }), { min: (0), max: (props_1.row.stock_available_partial), placeholder: "Lẻ" })));
        var __VLS_262 = __VLS_261.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_k = (_j = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _j === void 0 ? void 0 : _j.partial) !== null && _k !== void 0 ? _k : 0), type: "number", dense: true }), { class: "col" }), { style: {} }), { min: (0), max: (props_1.row.stock_available_partial), placeholder: "Lẻ" })], __VLS_functionalComponentArgsRest(__VLS_261), false));
        var __VLS_265 = void 0;
        var __VLS_266 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': (function (v) { return __VLS_ctx.handleInputChange(props_1.row.thread_type_id, 'partial', Number(v) || 0, props_1.row.stock_available_partial); }) });
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_263;
        var __VLS_264;
        if (__VLS_ctx.getUnderQuotaAmount(props_1.row) > 0 && (((_l = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _l === void 0 ? void 0 : _l.full) || ((_m = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _m === void 0 ? void 0 : _m.partial))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            var __VLS_267 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267({
                color: "info",
                outline: true,
            }));
            var __VLS_269 = __VLS_268.apply(void 0, __spreadArray([{
                    color: "info",
                    outline: true,
                }], __VLS_functionalComponentArgsRest(__VLS_268), false));
            var __VLS_272 = __VLS_270.slots.default;
            (__VLS_ctx.getUnderQuotaAmount(props_1.row).toFixed(2));
            // @ts-ignore
            [lineInputs, lineInputs, lineInputs, lineInputs, handleInputChange, handleInputChange, getUnderQuotaAmount, getUnderQuotaAmount,];
            var __VLS_270;
        }
        if ((_p = (_o = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _o === void 0 ? void 0 : _o.validation) === null || _p === void 0 ? void 0 : _p.is_over_quota) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            var __VLS_273 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273(__assign({ color: "warning" }, { class: "q-mb-xs" })));
            var __VLS_275 = __VLS_274.apply(void 0, __spreadArray([__assign({ color: "warning" }, { class: "q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_274), false));
            /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
            var __VLS_278 = __VLS_276.slots.default;
            // @ts-ignore
            [lineInputs,];
            var __VLS_276;
            var __VLS_279 = AppInput_vue_1.default;
            // @ts-ignore
            var __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_r = (_q = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _q === void 0 ? void 0 : _q.notes) !== null && _r !== void 0 ? _r : ''), dense: true, placeholder: "Ghi chú lý do..." }), { class: "q-mt-xs" })));
            var __VLS_281 = __VLS_280.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: ((_t = (_s = __VLS_ctx.lineInputs[props_1.row.thread_type_id]) === null || _s === void 0 ? void 0 : _s.notes) !== null && _t !== void 0 ? _t : ''), dense: true, placeholder: "Ghi chú lý do..." }), { class: "q-mt-xs" })], __VLS_functionalComponentArgsRest(__VLS_280), false));
            var __VLS_284 = void 0;
            var __VLS_285 = ({ 'update:modelValue': {} },
                { 'onUpdate:modelValue': (function (v) { var input = __VLS_ctx.lineInputs[props_1.row.thread_type_id]; if (input) {
                        input.notes = String(v);
                    } }) });
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            var __VLS_282;
            var __VLS_283;
        }
        // @ts-ignore
        [lineInputs, lineInputs,];
        var __VLS_250;
        // @ts-ignore
        [];
    }
    {
        var __VLS_286 = __VLS_222.slots["body-cell-equivalent"];
        var props = __VLS_vSlot(__VLS_286)[0];
        var __VLS_287 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_288 = __VLS_asFunctionalComponent1(__VLS_287, new __VLS_287({
            props: (props),
        }));
        var __VLS_289 = __VLS_288.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_288), false));
        var __VLS_292 = __VLS_290.slots.default;
        if ((_u = __VLS_ctx.lineInputs[props.row.thread_type_id]) === null || _u === void 0 ? void 0 : _u.validation) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            ((_w = (_v = __VLS_ctx.lineInputs[props.row.thread_type_id]) === null || _v === void 0 ? void 0 : _v.validation) === null || _w === void 0 ? void 0 : _w.issued_equivalent.toFixed(2));
            if (!((_y = (_x = __VLS_ctx.lineInputs[props.row.thread_type_id]) === null || _x === void 0 ? void 0 : _x.validation) === null || _y === void 0 ? void 0 : _y.stock_sufficient)) {
                var __VLS_293 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                qIcon;
                // @ts-ignore
                var __VLS_294 = __VLS_asFunctionalComponent1(__VLS_293, new __VLS_293({
                    name: "warning",
                    color: "negative",
                }));
                var __VLS_295 = __VLS_294.apply(void 0, __spreadArray([{
                        name: "warning",
                        color: "negative",
                    }], __VLS_functionalComponentArgsRest(__VLS_294), false));
                var __VLS_298 = __VLS_296.slots.default;
                var __VLS_299 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
                qTooltip;
                // @ts-ignore
                var __VLS_300 = __VLS_asFunctionalComponent1(__VLS_299, new __VLS_299({}));
                var __VLS_301 = __VLS_300.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_300), false));
                var __VLS_304 = __VLS_302.slots.default;
                // @ts-ignore
                [lineInputs, lineInputs, lineInputs,];
                var __VLS_302;
                // @ts-ignore
                [];
                var __VLS_296;
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        }
        // @ts-ignore
        [];
        var __VLS_290;
        // @ts-ignore
        [];
    }
    {
        var __VLS_305 = __VLS_222.slots["body-cell-actions"];
        var props_2 = __VLS_vSlot(__VLS_305)[0];
        var __VLS_306 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_307 = __VLS_asFunctionalComponent1(__VLS_306, new __VLS_306({
            props: (props_2),
        }));
        var __VLS_308 = __VLS_307.apply(void 0, __spreadArray([{
                props: (props_2),
            }], __VLS_functionalComponentArgsRest(__VLS_307), false));
        var __VLS_311 = __VLS_309.slots.default;
        var __VLS_312 = AppButton_vue_1.default || AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_313 = __VLS_asFunctionalComponent1(__VLS_312, new __VLS_312(__assign({ 'onClick': {} }, { icon: "add", size: "sm", color: "primary", dense: true, round: true, disable: (__VLS_ctx.isAddButtonDisabled(props_2.row.thread_type_id)) })));
        var __VLS_314 = __VLS_313.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "add", size: "sm", color: "primary", dense: true, round: true, disable: (__VLS_ctx.isAddButtonDisabled(props_2.row.thread_type_id)) })], __VLS_functionalComponentArgsRest(__VLS_313), false));
        var __VLS_317 = void 0;
        var __VLS_318 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!((__VLS_ctx.step2Visible || __VLS_ctx.hasIssue) && __VLS_ctx.availableThreadTypes.length > 0 && !__VLS_ctx.isConfirmed))
                        return;
                    __VLS_ctx.handleAddLine(props_2.row);
                    // @ts-ignore
                    [isAddButtonDisabled, handleAddLine,];
                } });
        var __VLS_319 = __VLS_315.slots.default;
        var __VLS_320 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({}));
        var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_321), false));
        var __VLS_325 = __VLS_323.slots.default;
        (__VLS_ctx.getAddButtonTooltip(props_2.row.thread_type_id));
        // @ts-ignore
        [getAddButtonTooltip,];
        var __VLS_323;
        // @ts-ignore
        [];
        var __VLS_315;
        var __VLS_316;
        // @ts-ignore
        [];
        var __VLS_309;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_222;
    // @ts-ignore
    [];
    var __VLS_216;
    // @ts-ignore
    [];
    var __VLS_210;
}
if (__VLS_ctx.hasIssue && __VLS_ctx.lines.length > 0) {
    var __VLS_326 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_327 = __VLS_asFunctionalComponent1(__VLS_326, new __VLS_326({
        flat: true,
        bordered: true,
    }));
    var __VLS_328 = __VLS_327.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_327), false));
    var __VLS_331 = __VLS_329.slots.default;
    var __VLS_332 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_333 = __VLS_asFunctionalComponent1(__VLS_332, new __VLS_332({}));
    var __VLS_334 = __VLS_333.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_333), false));
    var __VLS_337 = __VLS_335.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    (__VLS_ctx.lines.length);
    var __VLS_338 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_339 = __VLS_asFunctionalComponent1(__VLS_338, new __VLS_338({
        rows: (__VLS_ctx.lines),
        columns: (__VLS_ctx.addedLinesColumns),
        rowKey: "id",
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 0 }),
        hideBottom: true,
        rowClass: (function (row) { return __VLS_ctx.getRowClass(row); }),
    }));
    var __VLS_340 = __VLS_339.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.lines),
            columns: (__VLS_ctx.addedLinesColumns),
            rowKey: "id",
            flat: true,
            bordered: true,
            pagination: ({ rowsPerPage: 0 }),
            hideBottom: true,
            rowClass: (function (row) { return __VLS_ctx.getRowClass(row); }),
        }], __VLS_functionalComponentArgsRest(__VLS_339), false));
    var __VLS_343 = __VLS_341.slots.default;
    {
        var __VLS_344 = __VLS_341.slots["body-cell-thread"];
        var props = __VLS_vSlot(__VLS_344)[0];
        var __VLS_345 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345({
            props: (props),
        }));
        var __VLS_347 = __VLS_346.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_346), false));
        var __VLS_350 = __VLS_348.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.thread_code || props.row.thread_name);
        // @ts-ignore
        [hasIssue, lines, lines, lines, addedLinesColumns, getRowClass,];
        var __VLS_348;
        // @ts-ignore
        [];
    }
    {
        var __VLS_351 = __VLS_341.slots["body-cell-issued"];
        var props = __VLS_vSlot(__VLS_351)[0];
        var __VLS_352 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_353 = __VLS_asFunctionalComponent1(__VLS_352, new __VLS_352({
            props: (props),
        }));
        var __VLS_354 = __VLS_353.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_353), false));
        var __VLS_357 = __VLS_355.slots.default;
        (props.row.issued_full);
        (props.row.issued_partial);
        // @ts-ignore
        [];
        var __VLS_355;
        // @ts-ignore
        [];
    }
    {
        var __VLS_358 = __VLS_341.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_358)[0];
        var __VLS_359 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_360 = __VLS_asFunctionalComponent1(__VLS_359, new __VLS_359({
            props: (props),
        }));
        var __VLS_361 = __VLS_360.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_360), false));
        var __VLS_364 = __VLS_362.slots.default;
        if (props.row.is_over_quota) {
            var __VLS_365 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_366 = __VLS_asFunctionalComponent1(__VLS_365, new __VLS_365({
                color: "warning",
            }));
            var __VLS_367 = __VLS_366.apply(void 0, __spreadArray([{
                    color: "warning",
                }], __VLS_functionalComponentArgsRest(__VLS_366), false));
            var __VLS_370 = __VLS_368.slots.default;
            // @ts-ignore
            [];
            var __VLS_368;
        }
        else if (__VLS_ctx.getLineUnderQuotaAmount(props.row) > 0) {
            var __VLS_371 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_372 = __VLS_asFunctionalComponent1(__VLS_371, new __VLS_371({
                color: "info",
                outline: true,
            }));
            var __VLS_373 = __VLS_372.apply(void 0, __spreadArray([{
                    color: "info",
                    outline: true,
                }], __VLS_functionalComponentArgsRest(__VLS_372), false));
            var __VLS_376 = __VLS_374.slots.default;
            (__VLS_ctx.getLineUnderQuotaAmount(props.row).toFixed(2));
            // @ts-ignore
            [getLineUnderQuotaAmount, getLineUnderQuotaAmount,];
            var __VLS_374;
        }
        else {
            var __VLS_377 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_378 = __VLS_asFunctionalComponent1(__VLS_377, new __VLS_377({
                color: "positive",
            }));
            var __VLS_379 = __VLS_378.apply(void 0, __spreadArray([{
                    color: "positive",
                }], __VLS_functionalComponentArgsRest(__VLS_378), false));
            var __VLS_382 = __VLS_380.slots.default;
            // @ts-ignore
            [];
            var __VLS_380;
        }
        if (props.row.over_quota_notes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            (props.row.over_quota_notes);
        }
        // @ts-ignore
        [];
        var __VLS_362;
        // @ts-ignore
        [];
    }
    {
        var __VLS_383 = __VLS_341.slots["body-cell-actions"];
        var props_3 = __VLS_vSlot(__VLS_383)[0];
        var __VLS_384 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_385 = __VLS_asFunctionalComponent1(__VLS_384, new __VLS_384({
            props: (props_3),
        }));
        var __VLS_386 = __VLS_385.apply(void 0, __spreadArray([{
                props: (props_3),
            }], __VLS_functionalComponentArgsRest(__VLS_385), false));
        var __VLS_389 = __VLS_387.slots.default;
        if (!__VLS_ctx.isConfirmed) {
            var __VLS_390 = AppButton_vue_1.default || AppButton_vue_1.default;
            // @ts-ignore
            var __VLS_391 = __VLS_asFunctionalComponent1(__VLS_390, new __VLS_390(__assign({ 'onClick': {} }, { icon: "delete", size: "sm", variant: "flat", round: true, color: "negative" })));
            var __VLS_392 = __VLS_391.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "delete", size: "sm", variant: "flat", round: true, color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_391), false));
            var __VLS_395 = void 0;
            var __VLS_396 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.hasIssue && __VLS_ctx.lines.length > 0))
                            return;
                        if (!(!__VLS_ctx.isConfirmed))
                            return;
                        __VLS_ctx.handleRemoveLine(props_3.row.id);
                        // @ts-ignore
                        [isConfirmed, handleRemoveLine,];
                    } });
            var __VLS_397 = __VLS_393.slots.default;
            var __VLS_398 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_399 = __VLS_asFunctionalComponent1(__VLS_398, new __VLS_398({}));
            var __VLS_400 = __VLS_399.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_399), false));
            var __VLS_403 = __VLS_401.slots.default;
            // @ts-ignore
            [];
            var __VLS_401;
            // @ts-ignore
            [];
            var __VLS_393;
            var __VLS_394;
        }
        // @ts-ignore
        [];
        var __VLS_387;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_341;
    // @ts-ignore
    [];
    var __VLS_335;
    // @ts-ignore
    [];
    var __VLS_329;
}
if ((__VLS_ctx.step2Visible || __VLS_ctx.hasIssue) && __VLS_ctx.lines.length === 0 && __VLS_ctx.threadTypes.length === 0) {
    var __VLS_404 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_405 = __VLS_asFunctionalComponent1(__VLS_404, new __VLS_404({
        flat: true,
        bordered: true,
    }));
    var __VLS_406 = __VLS_405.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_405), false));
    var __VLS_409 = __VLS_407.slots.default;
    var __VLS_410 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_411 = __VLS_asFunctionalComponent1(__VLS_410, new __VLS_410(__assign({ class: "text-center text-grey q-py-xl" })));
    var __VLS_412 = __VLS_411.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey q-py-xl" })], __VLS_functionalComponentArgsRest(__VLS_411), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_415 = __VLS_413.slots.default;
    var __VLS_416 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_417 = __VLS_asFunctionalComponent1(__VLS_416, new __VLS_416(__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })));
    var __VLS_418 = __VLS_417.apply(void 0, __spreadArray([__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_417), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    // @ts-ignore
    [hasIssue, step2Visible, lines, threadTypes,];
    var __VLS_413;
    // @ts-ignore
    [];
    var __VLS_407;
}
if (__VLS_ctx.hasIssue && !__VLS_ctx.isConfirmed) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-end q-mt-lg" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
    var __VLS_421 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_422 = __VLS_asFunctionalComponent1(__VLS_421, new __VLS_421(__assign({ 'onClick': {} }, { label: "Xác Nhận Xuất", color: "positive", icon: "check", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canConfirm) })));
    var __VLS_423 = __VLS_422.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xác Nhận Xuất", color: "positive", icon: "check", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canConfirm) })], __VLS_functionalComponentArgsRest(__VLS_422), false));
    var __VLS_426 = void 0;
    var __VLS_427 = ({ click: {} },
        { onClick: (__VLS_ctx.handleConfirm) });
    var __VLS_424;
    var __VLS_425;
}
// @ts-ignore
[isConfirmed, hasIssue, isLoading, canConfirm, handleConfirm,];
var __VLS_43;
var __VLS_428;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_429 = __VLS_asFunctionalComponent1(__VLS_428, new __VLS_428({
    name: "history",
}));
var __VLS_430 = __VLS_429.apply(void 0, __spreadArray([{
        name: "history",
    }], __VLS_functionalComponentArgsRest(__VLS_429), false));
var __VLS_433 = __VLS_431.slots.default;
var __VLS_434;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_435 = __VLS_asFunctionalComponent1(__VLS_434, new __VLS_434(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
var __VLS_436 = __VLS_435.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_435), false));
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_439 = __VLS_437.slots.default;
var __VLS_440;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_441 = __VLS_asFunctionalComponent1(__VLS_440, new __VLS_440({}));
var __VLS_442 = __VLS_441.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_441), false));
var __VLS_445 = __VLS_443.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-end q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_446 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_447 = __VLS_asFunctionalComponent1(__VLS_446, new __VLS_446(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.localFilters.status), options: (__VLS_ctx.statusOptions), label: "Trạng Thái", clearable: true, dense: true, hideBottomSpace: true })));
var __VLS_448 = __VLS_447.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.localFilters.status), options: (__VLS_ctx.statusOptions), label: "Trạng Thái", clearable: true, dense: true, hideBottomSpace: true })], __VLS_functionalComponentArgsRest(__VLS_447), false));
var __VLS_451;
var __VLS_452 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleHistorySearch) });
var __VLS_449;
var __VLS_450;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_453 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_454 = __VLS_asFunctionalComponent1(__VLS_453, new __VLS_453({
    modelValue: (__VLS_ctx.localFilters.from),
    label: "Từ ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_455 = __VLS_454.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.localFilters.from),
        label: "Từ ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_454), false));
var __VLS_458 = __VLS_456.slots.default;
{
    var __VLS_459 = __VLS_456.slots.append;
    var __VLS_460 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_461 = __VLS_asFunctionalComponent1(__VLS_460, new __VLS_460(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_462 = __VLS_461.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_461), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_465 = __VLS_463.slots.default;
    var __VLS_466 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_467 = __VLS_asFunctionalComponent1(__VLS_466, new __VLS_466({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_468 = __VLS_467.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_467), false));
    var __VLS_471 = __VLS_469.slots.default;
    var __VLS_472 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_473 = __VLS_asFunctionalComponent1(__VLS_472, new __VLS_472({
        modelValue: (__VLS_ctx.localFilters.from),
    }));
    var __VLS_474 = __VLS_473.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.localFilters.from),
        }], __VLS_functionalComponentArgsRest(__VLS_473), false));
    // @ts-ignore
    [localFilters, localFilters, localFilters, statusOptions, handleHistorySearch, utils_1.dateRules,];
    var __VLS_469;
    // @ts-ignore
    [];
    var __VLS_463;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_456;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_477 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_478 = __VLS_asFunctionalComponent1(__VLS_477, new __VLS_477({
    modelValue: (__VLS_ctx.localFilters.to),
    label: "Đến ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_479 = __VLS_478.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.localFilters.to),
        label: "Đến ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_478), false));
var __VLS_482 = __VLS_480.slots.default;
{
    var __VLS_483 = __VLS_480.slots.append;
    var __VLS_484 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_485 = __VLS_asFunctionalComponent1(__VLS_484, new __VLS_484(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_486 = __VLS_485.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_485), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_489 = __VLS_487.slots.default;
    var __VLS_490 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_491 = __VLS_asFunctionalComponent1(__VLS_490, new __VLS_490({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_492 = __VLS_491.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_491), false));
    var __VLS_495 = __VLS_493.slots.default;
    var __VLS_496 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_497 = __VLS_asFunctionalComponent1(__VLS_496, new __VLS_496({
        modelValue: (__VLS_ctx.localFilters.to),
    }));
    var __VLS_498 = __VLS_497.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.localFilters.to),
        }], __VLS_functionalComponentArgsRest(__VLS_497), false));
    // @ts-ignore
    [localFilters, localFilters, utils_1.dateRules,];
    var __VLS_493;
    // @ts-ignore
    [];
    var __VLS_487;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_480;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-auto']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_501 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_502 = __VLS_asFunctionalComponent1(__VLS_501, new __VLS_501(__assign({ 'onClick': {} }, { color: "primary", label: "Tìm kiếm", icon: "search", unelevated: true })));
var __VLS_503 = __VLS_502.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tìm kiếm", icon: "search", unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_502), false));
var __VLS_506;
var __VLS_507 = ({ click: {} },
    { onClick: (__VLS_ctx.handleHistorySearch) });
var __VLS_504;
var __VLS_505;
var __VLS_508 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_509 = __VLS_asFunctionalComponent1(__VLS_508, new __VLS_508(__assign({ 'onClick': {} }, { outline: true, color: "grey", label: "Xóa", icon: "clear" })));
var __VLS_510 = __VLS_509.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { outline: true, color: "grey", label: "Xóa", icon: "clear" })], __VLS_functionalComponentArgsRest(__VLS_509), false));
var __VLS_513;
var __VLS_514 = ({ click: {} },
    { onClick: (__VLS_ctx.handleClearHistoryFilters) });
var __VLS_511;
var __VLS_512;
// @ts-ignore
[handleHistorySearch, handleClearHistoryFilters,];
var __VLS_443;
// @ts-ignore
[];
var __VLS_437;
var __VLS_515 = DataTable_vue_1.default || DataTable_vue_1.default;
// @ts-ignore
var __VLS_516 = __VLS_asFunctionalComponent1(__VLS_515, new __VLS_515(__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.historyPagination), rows: (__VLS_ctx.issues), columns: (__VLS_ctx.historyColumns), loading: (__VLS_ctx.isLoading), rowKey: "id", emptyIcon: "receipt_long", emptyTitle: "Chưa có phiếu xuất nào", emptySubtitle: "Tạo phiếu xuất mới để bắt đầu" }), { class: "history-table" })));
var __VLS_517 = __VLS_516.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.historyPagination), rows: (__VLS_ctx.issues), columns: (__VLS_ctx.historyColumns), loading: (__VLS_ctx.isLoading), rowKey: "id", emptyIcon: "receipt_long", emptyTitle: "Chưa có phiếu xuất nào", emptySubtitle: "Tạo phiếu xuất mới để bắt đầu" }), { class: "history-table" })], __VLS_functionalComponentArgsRest(__VLS_516), false));
var __VLS_520;
var __VLS_521 = ({ request: {} },
    { onRequest: (__VLS_ctx.handleHistoryRequest) });
var __VLS_522 = ({ rowClick: {} },
    { onRowClick: (__VLS_ctx.handleHistoryRowClick) });
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
var __VLS_523 = __VLS_518.slots.default;
{
    var __VLS_524 = __VLS_518.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_524)[0];
    var __VLS_525 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_526 = __VLS_asFunctionalComponent1(__VLS_525, new __VLS_525({
        props: (props),
    }));
    var __VLS_527 = __VLS_526.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_526), false));
    var __VLS_530 = __VLS_528.slots.default;
    var __VLS_531 = IssueV2StatusBadge_vue_1.default;
    // @ts-ignore
    var __VLS_532 = __VLS_asFunctionalComponent1(__VLS_531, new __VLS_531({
        status: (props.row.status),
    }));
    var __VLS_533 = __VLS_532.apply(void 0, __spreadArray([{
            status: (props.row.status),
        }], __VLS_functionalComponentArgsRest(__VLS_532), false));
    // @ts-ignore
    [isLoading, historyPagination, issues, historyColumns, handleHistoryRequest, handleHistoryRowClick,];
    var __VLS_528;
    // @ts-ignore
    [];
}
{
    var __VLS_536 = __VLS_518.slots["body-cell-created_at"];
    var props = __VLS_vSlot(__VLS_536)[0];
    var __VLS_537 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_538 = __VLS_asFunctionalComponent1(__VLS_537, new __VLS_537({
        props: (props),
    }));
    var __VLS_539 = __VLS_538.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_538), false));
    var __VLS_542 = __VLS_540.slots.default;
    (__VLS_ctx.formatDate(props.row.created_at));
    // @ts-ignore
    [formatDate,];
    var __VLS_540;
    // @ts-ignore
    [];
}
{
    var __VLS_543 = __VLS_518.slots["body-cell-actions"];
    var props_4 = __VLS_vSlot(__VLS_543)[0];
    var __VLS_544 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_545 = __VLS_asFunctionalComponent1(__VLS_544, new __VLS_544({
        props: (props_4),
    }));
    var __VLS_546 = __VLS_545.apply(void 0, __spreadArray([{
            props: (props_4),
        }], __VLS_functionalComponentArgsRest(__VLS_545), false));
    var __VLS_549 = __VLS_547.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row no-wrap justify-center q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    if (props_4.row.status === __VLS_ctx.IssueV2Status.DRAFT) {
        var __VLS_550 = AppButton_vue_1.default || AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_551 = __VLS_asFunctionalComponent1(__VLS_550, new __VLS_550(__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "check_circle", color: "positive" })));
        var __VLS_552 = __VLS_551.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "check_circle", color: "positive" })], __VLS_functionalComponentArgsRest(__VLS_551), false));
        var __VLS_555 = void 0;
        var __VLS_556 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_4.row.status === __VLS_ctx.IssueV2Status.DRAFT))
                        return;
                    __VLS_ctx.handleConfirmFromList(props_4.row);
                    // @ts-ignore
                    [issueV2_1.IssueV2Status, handleConfirmFromList,];
                } });
        var __VLS_557 = __VLS_553.slots.default;
        var __VLS_558 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_559 = __VLS_asFunctionalComponent1(__VLS_558, new __VLS_558({}));
        var __VLS_560 = __VLS_559.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_559), false));
        var __VLS_563 = __VLS_561.slots.default;
        // @ts-ignore
        [];
        var __VLS_561;
        // @ts-ignore
        [];
        var __VLS_553;
        var __VLS_554;
    }
    if (props_4.row.status === __VLS_ctx.IssueV2Status.DRAFT) {
        var __VLS_564 = AppButton_vue_1.default || AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_565 = __VLS_asFunctionalComponent1(__VLS_564, new __VLS_564(__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "delete", color: "negative" })));
        var __VLS_566 = __VLS_565.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "delete", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_565), false));
        var __VLS_569 = void 0;
        var __VLS_570 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_4.row.status === __VLS_ctx.IssueV2Status.DRAFT))
                        return;
                    __VLS_ctx.handleDeleteFromList(props_4.row);
                    // @ts-ignore
                    [issueV2_1.IssueV2Status, handleDeleteFromList,];
                } });
        var __VLS_571 = __VLS_567.slots.default;
        var __VLS_572 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_573 = __VLS_asFunctionalComponent1(__VLS_572, new __VLS_572({}));
        var __VLS_574 = __VLS_573.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_573), false));
        var __VLS_577 = __VLS_575.slots.default;
        // @ts-ignore
        [];
        var __VLS_575;
        // @ts-ignore
        [];
        var __VLS_567;
        var __VLS_568;
    }
    if (props_4.row.status === __VLS_ctx.IssueV2Status.CONFIRMED) {
        var __VLS_578 = AppButton_vue_1.default || AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_579 = __VLS_asFunctionalComponent1(__VLS_578, new __VLS_578(__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "replay", color: "info" })));
        var __VLS_580 = __VLS_579.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { variant: "flat", round: true, dense: true, size: "sm", icon: "replay", color: "info" })], __VLS_functionalComponentArgsRest(__VLS_579), false));
        var __VLS_583 = void 0;
        var __VLS_584 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_4.row.status === __VLS_ctx.IssueV2Status.CONFIRMED))
                        return;
                    __VLS_ctx.handleReturnFromList();
                    // @ts-ignore
                    [issueV2_1.IssueV2Status, handleReturnFromList,];
                } });
        var __VLS_585 = __VLS_581.slots.default;
        var __VLS_586 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_587 = __VLS_asFunctionalComponent1(__VLS_586, new __VLS_586({}));
        var __VLS_588 = __VLS_587.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_587), false));
        var __VLS_591 = __VLS_589.slots.default;
        // @ts-ignore
        [];
        var __VLS_589;
        // @ts-ignore
        [];
        var __VLS_581;
        var __VLS_582;
    }
    // @ts-ignore
    [];
    var __VLS_547;
    // @ts-ignore
    [];
}
{
    var __VLS_592 = __VLS_518.slots["empty-action"];
    var __VLS_593 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_594 = __VLS_asFunctionalComponent1(__VLS_593, new __VLS_593(__assign({ 'onClick': {} }, { color: "primary", label: "Tạo Phiếu Xuất", icon: "add" })));
    var __VLS_595 = __VLS_594.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tạo Phiếu Xuất", icon: "add" })], __VLS_functionalComponentArgsRest(__VLS_594), false));
    var __VLS_598 = void 0;
    var __VLS_599 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.activeTab = 'create';
                // @ts-ignore
                [activeTab,];
            } });
    var __VLS_596;
    var __VLS_597;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_518;
var __VLS_519;
// @ts-ignore
[];
var __VLS_431;
// @ts-ignore
[];
var __VLS_37;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
