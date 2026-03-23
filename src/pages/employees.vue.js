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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vuedraggable_1 = require("vuedraggable");
var composables_1 = require("@/composables");
var useAuth_1 = require("@/composables/useAuth");
var employeeService_1 = require("@/services/employeeService");
var snackbar = (0, composables_1.useSnackbar)();
var isRoot = (0, useAuth_1.useAuth)().isRoot;
var _b = (0, composables_1.useEmployees)(), employees = _b.employees, loading = _b.loading, fetchEmployees = _b.fetchEmployees, createEmployee = _b.createEmployee, updateEmployee = _b.updateEmployee, deleteEmployee = _b.deleteEmployee;
var searchQuery = (0, vue_1.ref)('');
var newPassword = (0, vue_1.ref)('');
var inlineEditLoading = (0, vue_1.ref)({});
var detailLoading = (0, vue_1.ref)(false);
var configSaving = (0, vue_1.ref)(false);
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'created_at',
    descending: true,
});
var formDialog = (0, vue_1.reactive)({
    isOpen: false,
    mode: 'create',
    employeeId: null,
});
var formData = (0, vue_1.reactive)({
    employee_id: '',
    full_name: '',
    department: '',
    chuc_vu: '',
});
var deleteDialog = (0, vue_1.reactive)({
    isOpen: false,
    employee: null,
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    employee: null,
});
var defaultDetailFields = [
    { key: 'employee_id', label: 'Mã Nhân Viên', visible: true, required: true },
    { key: 'full_name', label: 'Tên Nhân Viên', visible: true, required: true },
    { key: 'department', label: 'Phòng Ban', visible: true },
    { key: 'chuc_vu', label: 'Chức Vụ', visible: true },
    { key: 'is_active', label: 'Trạng thái', visible: true },
    { key: 'created_at', label: 'Ngày tạo', visible: true },
    { key: 'updated_at', label: 'Ngày cập nhật', visible: true },
    { key: 'last_login_at', label: 'Lần đăng nhập cuối', visible: false },
    { key: 'must_change_password', label: 'Bắt buộc đổi mật khẩu', visible: false },
    { key: 'password_changed_at', label: 'Ngày đổi mật khẩu', visible: false },
    { key: 'failed_login_attempts', label: 'Số lần đăng nhập thất bại', visible: false },
    { key: 'locked_until', label: 'Khóa đến', visible: false },
];
var configDialog = (0, vue_1.reactive)({
    isOpen: false,
    fields: JSON.parse(JSON.stringify(defaultDetailFields)),
});
var columns = [
    {
        name: 'employee_id',
        label: 'Mã NV',
        field: 'employee_id',
        align: 'left',
        sortable: true,
        required: true,
        style: 'min-width: 100px; width: 100px',
        headerStyle: 'min-width: 100px; width: 100px',
    },
    {
        name: 'full_name',
        label: 'Tên Nhân Viên',
        field: 'full_name',
        align: 'left',
        sortable: true,
        required: true,
        style: 'min-width: 180px; width: 200px',
        headerStyle: 'min-width: 180px; width: 200px',
    },
    {
        name: 'department',
        label: 'Phòng Ban',
        field: 'department',
        align: 'left',
        sortable: true,
        required: true,
        style: 'min-width: 150px; width: 150px',
        headerStyle: 'min-width: 150px; width: 150px',
    },
    {
        name: 'chuc_vu',
        label: 'Chức Vụ',
        field: 'chuc_vu',
        align: 'left',
        sortable: true,
        required: true,
        style: 'min-width: 130px; width: 130px',
        headerStyle: 'min-width: 130px; width: 130px',
    },
    {
        name: 'actions',
        label: 'Thao Tác',
        field: 'actions',
        align: 'center',
        required: true,
        style: 'min-width: 100px; width: 100px',
        headerStyle: 'min-width: 100px; width: 100px',
    },
];
var departmentOptions = (0, vue_1.computed)(function () {
    var departments = __spreadArray([], new Set(employees.value.map(function (e) { return e.department; }).filter(Boolean)), true);
    return departments.sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (dept) { return ({ label: dept, value: dept }); });
});
var chucVuOptions = (0, vue_1.computed)(function () {
    var positions = __spreadArray([], new Set(employees.value.map(function (e) { return e.chuc_vu; }).filter(Boolean)), true);
    return positions.sort(function (a, b) { return a.localeCompare(b, 'vi'); }).map(function (pos) { return ({ label: pos, value: pos }); });
});
var filteredEmployees = (0, vue_1.computed)(function () {
    if (!searchQuery.value.trim()) {
        return employees.value;
    }
    var query = searchQuery.value.toLowerCase().trim();
    return employees.value.filter(function (emp) {
        var _a, _b, _c, _d;
        return ((_a = emp.full_name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query)) ||
            ((_b = emp.employee_id) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(query)) ||
            ((_c = emp.department) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(query)) ||
            ((_d = emp.chuc_vu) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(query));
    });
});
var visibleDetailFields = (0, vue_1.computed)(function () {
    return configDialog.fields.filter(function (f) { return f.visible; });
});
(0, vue_1.watch)(searchQuery, function () {
    pagination.value.page = 1;
});
var getCellKey = function (id, field) { return "".concat(id, "-").concat(field); };
var getFieldValue = function (employee, key) {
    return employee[key];
};
var getBooleanValue = function (employee, key) {
    return !!employee[key];
};
var getBooleanLabel = function (employee, key) {
    return employee[key] ? 'Có' : 'Không';
};
var isDatetimeField = function (key) {
    return ['created_at', 'updated_at', 'last_login_at', 'password_changed_at', 'locked_until'].includes(key);
};
var getInitials = function (name) {
    if (!name)
        return '?';
    var words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
        return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};
var formatDateTime = function (dateString) {
    if (!dateString)
        return 'Chưa xác định';
    var date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
var handleInlineEdit = function (id, field, newValue, originalValue) { return __awaiter(void 0, void 0, void 0, function () {
    var emp, cellKey, result, emp, _a, emp;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (newValue === originalValue)
                    return [2 /*return*/];
                if (field === 'full_name' && !(newValue === null || newValue === void 0 ? void 0 : newValue.trim())) {
                    snackbar.error('Tên nhân viên không được để trống');
                    emp = employees.value.find(function (e) { return e.id === id; });
                    if (emp) {
                        emp[field] = originalValue;
                    }
                    return [2 /*return*/];
                }
                cellKey = getCellKey(id, field);
                inlineEditLoading.value[cellKey] = true;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, updateEmployee(id, (_b = {}, _b[field] = newValue, _b))];
            case 2:
                result = _c.sent();
                if (!result) {
                    emp = employees.value.find(function (e) { return e.id === id; });
                    if (emp) {
                        emp[field] = originalValue;
                    }
                }
                return [3 /*break*/, 5];
            case 3:
                _a = _c.sent();
                emp = employees.value.find(function (e) { return e.id === id; });
                if (emp) {
                    emp[field] = originalValue;
                }
                return [3 /*break*/, 5];
            case 4:
                inlineEditLoading.value[cellKey] = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var openAddDialog = function () {
    formDialog.mode = 'create';
    formDialog.employeeId = null;
    resetFormData();
    newPassword.value = '';
    formDialog.isOpen = true;
};
var openEditDialog = function (employee) {
    formDialog.mode = 'edit';
    formDialog.employeeId = employee.id;
    formData.employee_id = employee.employee_id;
    formData.full_name = employee.full_name;
    formData.department = employee.department || '';
    formData.chuc_vu = employee.chuc_vu || '';
    newPassword.value = '';
    formDialog.isOpen = true;
};
var closeFormDialog = function () {
    formDialog.isOpen = false;
    resetFormData();
};
var resetFormData = function () {
    formData.employee_id = '';
    formData.full_name = '';
    formData.department = '';
    formData.chuc_vu = '';
};
var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!formData.employee_id.trim() || !formData.full_name.trim()) {
                    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
                    return [2 /*return*/];
                }
                result = null;
                if (!(formDialog.mode === 'create')) return [3 /*break*/, 2];
                return [4 /*yield*/, createEmployee(__assign({}, formData))];
            case 1:
                result = _b.sent();
                return [3 /*break*/, 7];
            case 2:
                if (!formDialog.employeeId) return [3 /*break*/, 7];
                return [4 /*yield*/, updateEmployee(formDialog.employeeId, __assign({}, formData))];
            case 3:
                result = _b.sent();
                if (!(result && newPassword.value.trim())) return [3 /*break*/, 7];
                _b.label = 4;
            case 4:
                _b.trys.push([4, 6, , 7]);
                return [4 /*yield*/, employeeService_1.employeeService.resetPassword(formDialog.employeeId, newPassword.value.trim())];
            case 5:
                _b.sent();
                return [3 /*break*/, 7];
            case 6:
                _a = _b.sent();
                snackbar.error('Cập nhật thông tin thành công nhưng đổi mật khẩu thất bại');
                return [3 /*break*/, 7];
            case 7:
                if (result) {
                    closeFormDialog();
                }
                return [2 /*return*/];
        }
    });
}); };
var confirmDelete = function (employee) {
    deleteDialog.employee = employee;
    deleteDialog.isOpen = true;
};
var handleDelete = function () { return __awaiter(void 0, void 0, void 0, function () {
    var success;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!deleteDialog.employee)
                    return [2 /*return*/];
                return [4 /*yield*/, deleteEmployee(deleteDialog.employee.id)];
            case 1:
                success = _a.sent();
                if (success) {
                    deleteDialog.isOpen = false;
                    deleteDialog.employee = null;
                }
                return [2 /*return*/];
        }
    });
}); };
var openDetailDialog = function (employee) {
    detailDialog.employee = employee;
    detailDialog.isOpen = true;
};
var editFromDetail = function () {
    if (detailDialog.employee) {
        detailDialog.isOpen = false;
        openEditDialog(detailDialog.employee);
    }
};
var openConfigDialog = function () {
    configDialog.isOpen = true;
};
var saveConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        configSaving.value = true;
        try {
            configSaving.value = false;
            configDialog.isOpen = false;
            snackbar.success('Đã lưu cấu hình');
        }
        catch (_b) {
            configSaving.value = false;
            snackbar.error('Lỗi khi lưu cấu hình');
        }
        return [2 /*return*/];
    });
}); };
var restoreDefaultConfig = function () {
    configDialog.fields = JSON.parse(JSON.stringify(defaultDetailFields));
};
(0, vue_1.onMounted)(function () {
    fetchEmployees();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['employee-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-table']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-table']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
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
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader | typeof __VLS_components.PageHeader} */
PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Quản Lý Nhân Viên",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Quản Lý Nhân Viên",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
{
    var __VLS_13 = __VLS_10.slots.actions;
    var __VLS_14 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.SearchInput} */
    SearchInput;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm kiếm nhân viên...", hideBottomSpace: true }, { class: "search-input" })));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm kiếm nhân viên...", hideBottomSpace: true }, { class: "search-input" })], __VLS_functionalComponentArgsRest(__VLS_15), false));
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Nhân Viên", unelevated: true }), { class: "full-width-xs" })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Nhân Viên", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    var __VLS_24 = void 0;
    var __VLS_25 = ({ click: {} },
        { onClick: (__VLS_ctx.openAddDialog) });
    /** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
    var __VLS_22;
    var __VLS_23;
    if (__VLS_ctx.isRoot) {
        var __VLS_26 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ 'onClick': {} }, { color: "grey-7", icon: "settings", label: "Cấu hình", outline: true })));
        var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "grey-7", icon: "settings", label: "Cấu hình", outline: true })], __VLS_functionalComponentArgsRest(__VLS_27), false));
        var __VLS_31 = void 0;
        var __VLS_32 = ({ click: {} },
            { onClick: (__VLS_ctx.openConfigDialog) });
        var __VLS_29;
        var __VLS_30;
    }
    // @ts-ignore
    [searchQuery, openAddDialog, isRoot, openConfigDialog,];
}
// @ts-ignore
[];
var __VLS_10;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.DataTable | typeof __VLS_components.DataTable} */
DataTable;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ pagination: (__VLS_ctx.pagination), rows: (__VLS_ctx.filteredEmployees), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), emptyIcon: "people", emptyTitle: (__VLS_ctx.searchQuery ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'), emptySubtitle: (!__VLS_ctx.searchQuery ? 'Nhấn &quot;Thêm Nhân Viên&quot; để bắt đầu' : undefined) }, { class: "employee-table" })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), rows: (__VLS_ctx.filteredEmployees), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), emptyIcon: "people", emptyTitle: (__VLS_ctx.searchQuery ? 'Không tìm thấy nhân viên phù hợp' : 'Chưa có nhân viên nào'), emptySubtitle: (!__VLS_ctx.searchQuery ? 'Nhấn &quot;Thêm Nhân Viên&quot; để bắt đầu' : undefined) }, { class: "employee-table" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
/** @type {__VLS_StyleScopedClasses['employee-table']} */ ;
var __VLS_38 = __VLS_36.slots.default;
{
    var __VLS_39 = __VLS_36.slots["body-cell-full_name"];
    var props_1 = __VLS_vSlot(__VLS_39)[0];
    var __VLS_40 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ props: (props_1) }, { class: "cursor-pointer editable-cell" })));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
    var __VLS_45 = __VLS_43.slots.default;
    if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_1.row.id, 'full_name')]) {
        var __VLS_46 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppSpinner} */
        AppSpinner;
        // @ts-ignore
        var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            size: "sm",
        }));
        var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
                size: "sm",
            }], __VLS_functionalComponentArgsRest(__VLS_47), false));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
        /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
        (props_1.row.full_name);
        var __VLS_51 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
        var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_52), false));
        /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        var __VLS_56 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
        qPopupEdit;
        // @ts-ignore
        var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56(__assign({ 'onSave': {} }, { modelValue: (props_1.row.full_name), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
        var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_1.row.full_name), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_57), false));
        var __VLS_61 = void 0;
        var __VLS_62 = ({ save: {} },
            { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_1.row.id, 'full_name', val, initialVal); }) });
        {
            var __VLS_63 = __VLS_59.slots.default;
            var scope = __VLS_vSlot(__VLS_63)[0];
            var __VLS_64 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
            qInput;
            // @ts-ignore
            var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64(__assign({ 'onKeyup': {} }, { modelValue: (scope.value), dense: true, autofocus: true, rules: ([function (val) { return !!(val === null || val === void 0 ? void 0 : val.trim()) || 'Không được để trống'; }]) })));
            var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (scope.value), dense: true, autofocus: true, rules: ([function (val) { return !!(val === null || val === void 0 ? void 0 : val.trim()) || 'Không được để trống'; }]) })], __VLS_functionalComponentArgsRest(__VLS_65), false));
            var __VLS_69 = void 0;
            var __VLS_70 = ({ keyup: {} },
                { onKeyup: (scope.set) });
            var __VLS_67;
            var __VLS_68;
            // @ts-ignore
            [searchQuery, searchQuery, pagination, filteredEmployees, columns, loading, inlineEditLoading, getCellKey, handleInlineEdit,];
            __VLS_59.slots['' /* empty slot name completion */];
        }
        var __VLS_59;
        var __VLS_60;
    }
    // @ts-ignore
    [];
    var __VLS_43;
    // @ts-ignore
    [];
}
{
    var __VLS_71 = __VLS_36.slots["body-cell-department"];
    var props_2 = __VLS_vSlot(__VLS_71)[0];
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ props: (props_2) }, { class: "cursor-pointer editable-cell" })));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ props: (props_2) }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_73), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
    var __VLS_77 = __VLS_75.slots.default;
    if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_2.row.id, 'department')]) {
        var __VLS_78 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppSpinner} */
        AppSpinner;
        // @ts-ignore
        var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
            size: "sm",
        }));
        var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
                size: "sm",
            }], __VLS_functionalComponentArgsRest(__VLS_79), false));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
        /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
        (props_2.row.department);
        var __VLS_83 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
        var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_84), false));
        /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        var __VLS_88 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
        qPopupEdit;
        // @ts-ignore
        var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88(__assign({ 'onSave': {} }, { modelValue: (props_2.row.department), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
        var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_2.row.department), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_89), false));
        var __VLS_93 = void 0;
        var __VLS_94 = ({ save: {} },
            { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_2.row.id, 'department', val, initialVal); }) });
        {
            var __VLS_95 = __VLS_91.slots.default;
            var scope = __VLS_vSlot(__VLS_95)[0];
            var __VLS_96 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
            AppSelect;
            // @ts-ignore
            var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96(__assign({ modelValue: (scope.value), options: (__VLS_ctx.departmentOptions), dense: true, useInput: true, fillInput: true, hideSelected: true, popupContentClass: "z-max" }, { class: "inline-select" })));
            var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([__assign({ modelValue: (scope.value), options: (__VLS_ctx.departmentOptions), dense: true, useInput: true, fillInput: true, hideSelected: true, popupContentClass: "z-max" }, { class: "inline-select" })], __VLS_functionalComponentArgsRest(__VLS_97), false));
            /** @type {__VLS_StyleScopedClasses['inline-select']} */ ;
            // @ts-ignore
            [inlineEditLoading, getCellKey, handleInlineEdit, departmentOptions,];
            __VLS_91.slots['' /* empty slot name completion */];
        }
        var __VLS_91;
        var __VLS_92;
    }
    // @ts-ignore
    [];
    var __VLS_75;
    // @ts-ignore
    [];
}
{
    var __VLS_101 = __VLS_36.slots["body-cell-chuc_vu"];
    var props_3 = __VLS_vSlot(__VLS_101)[0];
    var __VLS_102 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign({ props: (props_3) }, { class: "cursor-pointer editable-cell" })));
    var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign({ props: (props_3) }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_103), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
    var __VLS_107 = __VLS_105.slots.default;
    if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_3.row.id, 'chuc_vu')]) {
        var __VLS_108 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppSpinner} */
        AppSpinner;
        // @ts-ignore
        var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
            size: "sm",
        }));
        var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([{
                size: "sm",
            }], __VLS_functionalComponentArgsRest(__VLS_109), false));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
        /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
        (props_3.row.chuc_vu);
        var __VLS_113 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
        var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_114), false));
        /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        var __VLS_118 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
        qPopupEdit;
        // @ts-ignore
        var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118(__assign({ 'onSave': {} }, { modelValue: (props_3.row.chuc_vu), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
        var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_3.row.chuc_vu), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_119), false));
        var __VLS_123 = void 0;
        var __VLS_124 = ({ save: {} },
            { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_3.row.id, 'chuc_vu', val, initialVal); }) });
        {
            var __VLS_125 = __VLS_121.slots.default;
            var scope = __VLS_vSlot(__VLS_125)[0];
            var __VLS_126 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
            AppSelect;
            // @ts-ignore
            var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126(__assign({ modelValue: (scope.value), options: (__VLS_ctx.chucVuOptions), dense: true, useInput: true, fillInput: true, hideSelected: true, popupContentClass: "z-max" }, { class: "inline-select" })));
            var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([__assign({ modelValue: (scope.value), options: (__VLS_ctx.chucVuOptions), dense: true, useInput: true, fillInput: true, hideSelected: true, popupContentClass: "z-max" }, { class: "inline-select" })], __VLS_functionalComponentArgsRest(__VLS_127), false));
            /** @type {__VLS_StyleScopedClasses['inline-select']} */ ;
            // @ts-ignore
            [inlineEditLoading, getCellKey, handleInlineEdit, chucVuOptions,];
            __VLS_121.slots['' /* empty slot name completion */];
        }
        var __VLS_121;
        var __VLS_122;
    }
    // @ts-ignore
    [];
    var __VLS_105;
    // @ts-ignore
    [];
}
{
    var __VLS_131 = __VLS_36.slots["body-cell-actions"];
    var props_4 = __VLS_vSlot(__VLS_131)[0];
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
        props: (props_4),
    }));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{
            props: (props_4),
        }], __VLS_functionalComponentArgsRest(__VLS_133), false));
    var __VLS_137 = __VLS_135.slots.default;
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.IconButton | typeof __VLS_components.IconButton} */
    IconButton;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ 'onClick': {} }, { icon: "visibility", color: "info" })));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "visibility", color: "info" })], __VLS_functionalComponentArgsRest(__VLS_139), false));
    var __VLS_143 = void 0;
    var __VLS_144 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openDetailDialog(props_4.row);
                // @ts-ignore
                [openDetailDialog,];
            } });
    var __VLS_145 = __VLS_141.slots.default;
    var __VLS_146 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({
        text: "Xem chi tiết",
    }));
    var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([{
            text: "Xem chi tiết",
        }], __VLS_functionalComponentArgsRest(__VLS_147), false));
    // @ts-ignore
    [];
    var __VLS_141;
    var __VLS_142;
    var __VLS_151 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.IconButton | typeof __VLS_components.IconButton} */
    IconButton;
    // @ts-ignore
    var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ 'onClick': {} }, { icon: "edit", color: "primary" })));
    var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "edit", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_152), false));
    var __VLS_156 = void 0;
    var __VLS_157 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openEditDialog(props_4.row);
                // @ts-ignore
                [openEditDialog,];
            } });
    var __VLS_158 = __VLS_154.slots.default;
    var __VLS_159 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
        text: "Sửa (Modal)",
    }));
    var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([{
            text: "Sửa (Modal)",
        }], __VLS_functionalComponentArgsRest(__VLS_160), false));
    // @ts-ignore
    [];
    var __VLS_154;
    var __VLS_155;
    var __VLS_164 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.IconButton | typeof __VLS_components.IconButton} */
    IconButton;
    // @ts-ignore
    var __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164(__assign({ 'onClick': {} }, { icon: "delete", color: "negative" })));
    var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "delete", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_165), false));
    var __VLS_169 = void 0;
    var __VLS_170 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.confirmDelete(props_4.row);
                // @ts-ignore
                [confirmDelete,];
            } });
    var __VLS_171 = __VLS_167.slots.default;
    var __VLS_172 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172({
        text: "Xóa",
    }));
    var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([{
            text: "Xóa",
        }], __VLS_functionalComponentArgsRest(__VLS_173), false));
    // @ts-ignore
    [];
    var __VLS_167;
    var __VLS_168;
    // @ts-ignore
    [];
    var __VLS_135;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_36;
var __VLS_177;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_178 = __VLS_asFunctionalComponent1(__VLS_177, new __VLS_177(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.formDialog.isOpen), title: (__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'), submitText: "Lưu", cancelText: "Hủy", loading: (__VLS_ctx.loading), persistent: true, maxWidth: "500px" })));
var __VLS_179 = __VLS_178.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.formDialog.isOpen), title: (__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Nhân Viên'), submitText: "Lưu", cancelText: "Hủy", loading: (__VLS_ctx.loading), persistent: true, maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_178), false));
var __VLS_182;
var __VLS_183 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
var __VLS_184 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.closeFormDialog) });
var __VLS_185 = __VLS_180.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_186;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
    modelValue: (__VLS_ctx.formData.employee_id),
    label: "Mã Nhân Viên",
    prependIcon: "badge",
    required: true,
    disable: (__VLS_ctx.formDialog.mode === 'edit'),
}));
var __VLS_188 = __VLS_187.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.employee_id),
        label: "Mã Nhân Viên",
        prependIcon: "badge",
        required: true,
        disable: (__VLS_ctx.formDialog.mode === 'edit'),
    }], __VLS_functionalComponentArgsRest(__VLS_187), false));
var __VLS_191;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({
    modelValue: (__VLS_ctx.formData.full_name),
    label: "Tên Nhân Viên",
    prependIcon: "person",
    required: true,
}));
var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.full_name),
        label: "Tên Nhân Viên",
        prependIcon: "person",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_192), false));
var __VLS_196;
/** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196({
    modelValue: (__VLS_ctx.formData.department),
    label: "Phòng Ban",
    options: (__VLS_ctx.departmentOptions),
    useInput: true,
    newValueMode: "add-unique",
    behavior: "menu",
    clearable: true,
    popupContentClass: "z-max",
}));
var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.department),
        label: "Phòng Ban",
        options: (__VLS_ctx.departmentOptions),
        useInput: true,
        newValueMode: "add-unique",
        behavior: "menu",
        clearable: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_197), false));
var __VLS_201 = __VLS_199.slots.default;
{
    var __VLS_202 = __VLS_199.slots.prepend;
    var __VLS_203 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_204 = __VLS_asFunctionalComponent1(__VLS_203, new __VLS_203({
        name: "business",
    }));
    var __VLS_205 = __VLS_204.apply(void 0, __spreadArray([{
            name: "business",
        }], __VLS_functionalComponentArgsRest(__VLS_204), false));
    // @ts-ignore
    [loading, departmentOptions, formDialog, formDialog, formDialog, handleSubmit, closeFormDialog, formData, formData, formData,];
}
// @ts-ignore
[];
var __VLS_199;
var __VLS_208;
/** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({
    modelValue: (__VLS_ctx.formData.chuc_vu),
    label: "Chức Vụ",
    options: (__VLS_ctx.chucVuOptions),
    useInput: true,
    fillInput: true,
    hideSelected: true,
    clearable: true,
    popupContentClass: "z-max",
}));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.chuc_vu),
        label: "Chức Vụ",
        options: (__VLS_ctx.chucVuOptions),
        useInput: true,
        fillInput: true,
        hideSelected: true,
        clearable: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_209), false));
var __VLS_213 = __VLS_211.slots.default;
{
    var __VLS_214 = __VLS_211.slots.prepend;
    var __VLS_215 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
        name: "work",
    }));
    var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([{
            name: "work",
        }], __VLS_functionalComponentArgsRest(__VLS_216), false));
    // @ts-ignore
    [chucVuOptions, formData,];
}
// @ts-ignore
[];
var __VLS_211;
if (__VLS_ctx.formDialog.mode === 'edit') {
    var __VLS_220 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({
        modelValue: (__VLS_ctx.newPassword),
        label: "Mật khẩu mới",
        type: "password",
        prependIcon: "lock",
        autocomplete: "new-password",
    }));
    var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.newPassword),
            label: "Mật khẩu mới",
            type: "password",
            prependIcon: "lock",
            autocomplete: "new-password",
        }], __VLS_functionalComponentArgsRest(__VLS_221), false));
}
// @ts-ignore
[formDialog, newPassword,];
var __VLS_180;
var __VLS_181;
var __VLS_225;
/** @ts-ignore @type {typeof __VLS_components.DeleteDialog} */
DeleteDialog;
// @ts-ignore
var __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225(__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.deleteDialog.isOpen), itemName: (__VLS_ctx.deleteDialog.employee ? "".concat(__VLS_ctx.deleteDialog.employee.full_name, " (").concat(__VLS_ctx.deleteDialog.employee.employee_id, ")") : ''), loading: (__VLS_ctx.loading) })));
var __VLS_227 = __VLS_226.apply(void 0, __spreadArray([__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.deleteDialog.isOpen), itemName: (__VLS_ctx.deleteDialog.employee ? "".concat(__VLS_ctx.deleteDialog.employee.full_name, " (").concat(__VLS_ctx.deleteDialog.employee.employee_id, ")") : ''), loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_226), false));
var __VLS_230;
var __VLS_231 = ({ confirm: {} },
    { onConfirm: (__VLS_ctx.handleDelete) });
var __VLS_228;
var __VLS_229;
var __VLS_232;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232({
    modelValue: (__VLS_ctx.detailDialog.isOpen),
}));
var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.detailDialog.isOpen),
    }], __VLS_functionalComponentArgsRest(__VLS_233), false));
var __VLS_237 = __VLS_235.slots.default;
var __VLS_238;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238(__assign({ class: "dialog-card" })));
var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([__assign({ class: "dialog-card" })], __VLS_functionalComponentArgsRest(__VLS_239), false));
/** @type {__VLS_StyleScopedClasses['dialog-card']} */ ;
var __VLS_243 = __VLS_241.slots.default;
var __VLS_244;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244(__assign({ class: "row items-center q-pb-none" })));
var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_245), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_249 = __VLS_247.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_250;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250({}));
var __VLS_252 = __VLS_251.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_251), false));
var __VLS_255;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_257 = __VLS_256.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_256), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[loading, deleteDialog, deleteDialog, deleteDialog, deleteDialog, handleDelete, detailDialog, vClosePopup,];
var __VLS_247;
var __VLS_260;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_261 = __VLS_asFunctionalComponent1(__VLS_260, new __VLS_260(__assign({ class: "q-pa-md" })));
var __VLS_262 = __VLS_261.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_261), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_265 = __VLS_263.slots.default;
var __VLS_266;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_267 = __VLS_asFunctionalComponent1(__VLS_266, new __VLS_266({
    showing: (__VLS_ctx.detailLoading),
}));
var __VLS_268 = __VLS_267.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.detailLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_267), false));
if (__VLS_ctx.detailDialog.employee && !__VLS_ctx.detailLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_271 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_272 = __VLS_asFunctionalComponent1(__VLS_271, new __VLS_271(__assign({ size: "48px", color: "primary", textColor: "white" }, { class: "q-mr-md text-h6 text-weight-bold" })));
    var __VLS_273 = __VLS_272.apply(void 0, __spreadArray([__assign({ size: "48px", color: "primary", textColor: "white" }, { class: "q-mr-md text-h6 text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_272), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    var __VLS_276 = __VLS_274.slots.default;
    (__VLS_ctx.getInitials(__VLS_ctx.detailDialog.employee.full_name));
    // @ts-ignore
    [detailDialog, detailDialog, detailLoading, detailLoading, getInitials,];
    var __VLS_274;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.detailDialog.employee.full_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.detailDialog.employee.employee_id);
    for (var _i = 0, _c = __VLS_vFor((__VLS_ctx.visibleDetailFields)); _i < _c.length; _i++) {
        var field = _c[_i][0];
        (field.key);
        if (field.key !== 'employee_id' && field.key !== 'full_name') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            (field.label);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            if (field.key === 'is_active' || field.key === 'must_change_password') {
                var __VLS_277 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
                qBadge;
                // @ts-ignore
                var __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277({
                    color: (__VLS_ctx.getBooleanValue(__VLS_ctx.detailDialog.employee, field.key) ? 'positive' : 'negative'),
                }));
                var __VLS_279 = __VLS_278.apply(void 0, __spreadArray([{
                        color: (__VLS_ctx.getBooleanValue(__VLS_ctx.detailDialog.employee, field.key) ? 'positive' : 'negative'),
                    }], __VLS_functionalComponentArgsRest(__VLS_278), false));
                var __VLS_282 = __VLS_280.slots.default;
                (__VLS_ctx.getBooleanLabel(__VLS_ctx.detailDialog.employee, field.key));
                // @ts-ignore
                [detailDialog, detailDialog, detailDialog, detailDialog, visibleDetailFields, getBooleanValue, getBooleanLabel,];
                var __VLS_280;
            }
            else if (__VLS_ctx.isDatetimeField(field.key)) {
                (__VLS_ctx.formatDateTime(__VLS_ctx.getFieldValue(__VLS_ctx.detailDialog.employee, field.key)));
            }
            else {
                ((_a = __VLS_ctx.getFieldValue(__VLS_ctx.detailDialog.employee, field.key)) !== null && _a !== void 0 ? _a : '-');
            }
        }
        // @ts-ignore
        [detailDialog, detailDialog, isDatetimeField, formatDateTime, getFieldValue, getFieldValue,];
    }
}
// @ts-ignore
[];
var __VLS_263;
var __VLS_283;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_284 = __VLS_asFunctionalComponent1(__VLS_283, new __VLS_283(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
var __VLS_285 = __VLS_284.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_284), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
var __VLS_288 = __VLS_286.slots.default;
var __VLS_289;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_290 = __VLS_asFunctionalComponent1(__VLS_289, new __VLS_289(__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })));
var __VLS_291 = __VLS_290.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })], __VLS_functionalComponentArgsRest(__VLS_290), false));
var __VLS_294;
var __VLS_295 = ({ click: {} },
    { onClick: (__VLS_ctx.editFromDetail) });
var __VLS_292;
var __VLS_293;
var __VLS_296;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_297 = __VLS_asFunctionalComponent1(__VLS_296, new __VLS_296({
    unelevated: true,
    label: "Đóng",
    color: "grey",
}));
var __VLS_298 = __VLS_297.apply(void 0, __spreadArray([{
        unelevated: true,
        label: "Đóng",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_297), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup, editFromDetail,];
var __VLS_286;
// @ts-ignore
[];
var __VLS_241;
// @ts-ignore
[];
var __VLS_235;
var __VLS_301;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_302 = __VLS_asFunctionalComponent1(__VLS_301, new __VLS_301({
    modelValue: (__VLS_ctx.configDialog.isOpen),
}));
var __VLS_303 = __VLS_302.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.configDialog.isOpen),
    }], __VLS_functionalComponentArgsRest(__VLS_302), false));
var __VLS_306 = __VLS_304.slots.default;
var __VLS_307;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_308 = __VLS_asFunctionalComponent1(__VLS_307, new __VLS_307(__assign({ class: "dialog-card" })));
var __VLS_309 = __VLS_308.apply(void 0, __spreadArray([__assign({ class: "dialog-card" })], __VLS_functionalComponentArgsRest(__VLS_308), false));
/** @type {__VLS_StyleScopedClasses['dialog-card']} */ ;
var __VLS_312 = __VLS_310.slots.default;
var __VLS_313;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_314 = __VLS_asFunctionalComponent1(__VLS_313, new __VLS_313(__assign({ class: "row items-center q-pb-none" })));
var __VLS_315 = __VLS_314.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_314), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_318 = __VLS_316.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_319;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_320 = __VLS_asFunctionalComponent1(__VLS_319, new __VLS_319({}));
var __VLS_321 = __VLS_320.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_320), false));
var __VLS_324;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_325 = __VLS_asFunctionalComponent1(__VLS_324, new __VLS_324({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_326 = __VLS_325.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_325), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup, configDialog,];
var __VLS_316;
var __VLS_329;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_330 = __VLS_asFunctionalComponent1(__VLS_329, new __VLS_329({}));
var __VLS_331 = __VLS_330.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_330), false));
var __VLS_334 = __VLS_332.slots.default;
var __VLS_335;
/** @ts-ignore @type {typeof __VLS_components.draggable | typeof __VLS_components.Draggable | typeof __VLS_components.draggable | typeof __VLS_components.Draggable} */
vuedraggable_1.default;
// @ts-ignore
var __VLS_336 = __VLS_asFunctionalComponent1(__VLS_335, new __VLS_335({
    modelValue: (__VLS_ctx.configDialog.fields),
    itemKey: "key",
    handle: ".drag-handle",
}));
var __VLS_337 = __VLS_336.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.configDialog.fields),
        itemKey: "key",
        handle: ".drag-handle",
    }], __VLS_functionalComponentArgsRest(__VLS_336), false));
var __VLS_340 = __VLS_338.slots.default;
{
    var __VLS_341 = __VLS_338.slots.item;
    var element = __VLS_vSlot(__VLS_341)[0].element;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "config-field-row q-py-xs" }));
    /** @type {__VLS_StyleScopedClasses['config-field-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    var __VLS_342 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342(__assign(__assign({ name: "drag_indicator" }, { class: "drag-handle cursor-grab q-mr-sm text-grey-6" }), { size: "sm" })));
    var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([__assign(__assign({ name: "drag_indicator" }, { class: "drag-handle cursor-grab q-mr-sm text-grey-6" }), { size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_343), false));
    /** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-grab']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_347 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
    qCheckbox;
    // @ts-ignore
    var __VLS_348 = __VLS_asFunctionalComponent1(__VLS_347, new __VLS_347(__assign({ modelValue: (element.visible), disable: (element.required), dense: true }, { class: "q-mr-sm" })));
    var __VLS_349 = __VLS_348.apply(void 0, __spreadArray([__assign({ modelValue: (element.visible), disable: (element.required), dense: true }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_348), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "config-field-label" }));
    /** @type {__VLS_StyleScopedClasses['config-field-label']} */ ;
    (element.label);
    if (element.required) {
        var __VLS_352 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_353 = __VLS_asFunctionalComponent1(__VLS_352, new __VLS_352(__assign({ name: "lock", size: "xs" }, { class: "q-ml-xs text-grey-5" })));
        var __VLS_354 = __VLS_353.apply(void 0, __spreadArray([__assign({ name: "lock", size: "xs" }, { class: "q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_353), false));
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    // @ts-ignore
    [configDialog,];
}
// @ts-ignore
[];
var __VLS_338;
// @ts-ignore
[];
var __VLS_332;
var __VLS_357;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_358 = __VLS_asFunctionalComponent1(__VLS_357, new __VLS_357(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
var __VLS_359 = __VLS_358.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_358), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
var __VLS_362 = __VLS_360.slots.default;
var __VLS_363;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_364 = __VLS_asFunctionalComponent1(__VLS_363, new __VLS_363(__assign({ 'onClick': {} }, { flat: true, label: "Khôi phục mặc định", color: "orange", icon: "restore" })));
var __VLS_365 = __VLS_364.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Khôi phục mặc định", color: "orange", icon: "restore" })], __VLS_functionalComponentArgsRest(__VLS_364), false));
var __VLS_368;
var __VLS_369 = ({ click: {} },
    { onClick: (__VLS_ctx.restoreDefaultConfig) });
var __VLS_366;
var __VLS_367;
var __VLS_370;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_371 = __VLS_asFunctionalComponent1(__VLS_370, new __VLS_370({}));
var __VLS_372 = __VLS_371.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_371), false));
var __VLS_375;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_376 = __VLS_asFunctionalComponent1(__VLS_375, new __VLS_375(__assign({ 'onClick': {} }, { flat: true, label: "Hủy", color: "grey" })));
var __VLS_377 = __VLS_376.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Hủy", color: "grey" })], __VLS_functionalComponentArgsRest(__VLS_376), false));
var __VLS_380;
var __VLS_381 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.configDialog.isOpen = false;
            // @ts-ignore
            [configDialog, restoreDefaultConfig,];
        } });
var __VLS_378;
var __VLS_379;
var __VLS_382;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_383 = __VLS_asFunctionalComponent1(__VLS_382, new __VLS_382(__assign({ 'onClick': {} }, { unelevated: true, label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.configSaving) })));
var __VLS_384 = __VLS_383.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.configSaving) })], __VLS_functionalComponentArgsRest(__VLS_383), false));
var __VLS_387;
var __VLS_388 = ({ click: {} },
    { onClick: (__VLS_ctx.saveConfig) });
var __VLS_385;
var __VLS_386;
// @ts-ignore
[configSaving, saveConfig,];
var __VLS_360;
// @ts-ignore
[];
var __VLS_310;
// @ts-ignore
[];
var __VLS_304;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
