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
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var useDashboard_1 = require("@/composables/thread/useDashboard");
var router = (0, vue_router_1.useRouter)();
var props = withDefaults(defineProps(), {
    autoFetch: true,
});
// Composables
var _a = (0, useDashboard_1.useDashboard)(), conflicts = _a.conflicts, fetchConflicts = _a.fetchConflicts;
// Computed
var conflictCount = (0, vue_1.computed)(function () { var _a; return ((_a = conflicts.value) === null || _a === void 0 ? void 0 : _a.total_conflicts) || 0; });
var topConflicts = (0, vue_1.computed)(function () {
    var _a;
    var conflictList = ((_a = conflicts.value) === null || _a === void 0 ? void 0 : _a.conflicts) || [];
    return conflictList.slice(0, 3);
});
// Methods
var formatNumber = function (num) {
    return new Intl.NumberFormat('vi-VN').format(num);
};
var getPriorityColor = function (priority) {
    switch (priority) {
        case 'high':
            return 'negative';
        case 'medium':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'grey';
    }
};
var getPriorityLabel = function (priority) {
    switch (priority) {
        case 'high':
            return 'Cao';
        case 'medium':
            return 'Trung bình';
        case 'low':
            return 'Thấp';
        default:
            return 'N/A';
    }
};
var viewConflict = function (conflict) {
    router.push({
        path: '/thread/allocations',
        query: { conflict_id: conflict.id.toString() },
    });
};
var viewAllConflicts = function () {
    router.push('/thread/allocations?tab=conflicts');
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    if (props.autoFetch) {
        fetchConflicts();
    }
});
var __VLS_defaults = {
    autoFetch: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    bordered: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    name: "warning",
    color: "warning",
    size: "24px",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "warning",
        color: "warning",
        size: "24px",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
if (__VLS_ctx.conflictCount > 0) {
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        color: "negative",
        label: (__VLS_ctx.conflictCount),
        rounded: true,
    }));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
            color: "negative",
            label: (__VLS_ctx.conflictCount),
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_19), false));
}
if (__VLS_ctx.conflictCount === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "check_circle",
        color: "positive",
        size: "48px",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "check_circle",
            color: "positive",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
else {
    var __VLS_28 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        separator: true,
        dense: true,
    }));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
            separator: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = __VLS_31.slots.default;
    var _loop_1 = function (conflict) {
        var __VLS_34 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ 'onClick': {} }, { key: (conflict.id), clickable: true })));
        var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (conflict.id), clickable: true })], __VLS_functionalComponentArgsRest(__VLS_35), false));
        var __VLS_39 = void 0;
        var __VLS_40 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.conflictCount === 0))
                        return;
                    __VLS_ctx.viewConflict(conflict);
                    // @ts-ignore
                    [$attrs, conflictCount, conflictCount, conflictCount, topConflicts, viewConflict,];
                } });
        var __VLS_41 = __VLS_37.slots.default;
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            avatar: true,
        }));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_43), false));
        var __VLS_47 = __VLS_45.slots.default;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            color: "negative",
            textColor: "white",
            size: "32px",
        }));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
                color: "negative",
                textColor: "white",
                size: "32px",
            }], __VLS_functionalComponentArgsRest(__VLS_49), false));
        var __VLS_53 = __VLS_51.slots.default;
        var __VLS_54 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
            name: "priority_high",
            size: "18px",
        }));
        var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{
                name: "priority_high",
                size: "18px",
            }], __VLS_functionalComponentArgsRest(__VLS_55), false));
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_59 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({}));
        var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_60), false));
        var __VLS_64 = __VLS_62.slots.default;
        var __VLS_65 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({}));
        var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_66), false));
        var __VLS_70 = __VLS_68.slots.default;
        (conflict.thread_type_name || conflict.thread_type_code);
        // @ts-ignore
        [];
        var __VLS_71 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign({ caption: true }, { class: "text-negative" })));
        var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-negative" })], __VLS_functionalComponentArgsRest(__VLS_72), false));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        var __VLS_76 = __VLS_74.slots.default;
        (__VLS_ctx.formatNumber(conflict.shortage));
        // @ts-ignore
        [formatNumber,];
        // @ts-ignore
        [];
        var __VLS_77 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
            side: true,
        }));
        var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_78), false));
        var __VLS_82 = __VLS_80.slots.default;
        var __VLS_83 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
            color: (__VLS_ctx.getPriorityColor(conflict.priority)),
            label: (__VLS_ctx.getPriorityLabel(conflict.priority)),
        }));
        var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getPriorityColor(conflict.priority)),
                label: (__VLS_ctx.getPriorityLabel(conflict.priority)),
            }], __VLS_functionalComponentArgsRest(__VLS_84), false));
        // @ts-ignore
        [getPriorityColor, getPriorityLabel,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_51, __VLS_45, __VLS_68, __VLS_74, __VLS_62, __VLS_80, __VLS_37, __VLS_38;
    for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.topConflicts)); _i < _b.length; _i++) {
        var conflict = _b[_i][0];
        _loop_1(conflict);
    }
    // @ts-ignore
    [];
    var __VLS_31;
}
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.conflictCount > 3) {
    var __VLS_88 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({}));
    var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_89), false));
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
        align: "right",
    }));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_94), false));
    var __VLS_98 = __VLS_96.slots.default;
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = void 0;
    var __VLS_105 = ({ click: {} },
        { onClick: (__VLS_ctx.viewAllConflicts) });
    var __VLS_102;
    var __VLS_103;
    // @ts-ignore
    [conflictCount, viewAllConflicts,];
    var __VLS_96;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
