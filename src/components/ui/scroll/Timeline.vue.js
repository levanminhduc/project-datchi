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
var quasar_1 = require("quasar");
var props = withDefaults(defineProps(), {
    entries: function () { return []; },
    color: 'primary',
    side: 'right',
    layout: 'comfortable'
});
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var __VLS_defaults = {
    entries: function () { return []; },
    color: 'primary',
    side: 'right',
    layout: 'comfortable'
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline | typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline} */
qTimeline;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    color: (__VLS_ctx.color),
    side: (__VLS_ctx.side),
    layout: (__VLS_ctx.layout),
    dark: (__VLS_ctx.isDark),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        color: (__VLS_ctx.color),
        side: (__VLS_ctx.side),
        layout: (__VLS_ctx.layout),
        dark: (__VLS_ctx.isDark),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.entries)); _i < _a.length; _i++) {
    var _b = _a[_i], entry = _b[0], index = _b[1];
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry} */
    qTimelineEntry;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        key: (index),
        title: (entry.title),
        subtitle: (entry.subtitle),
        body: (entry.body),
        color: (entry.color || __VLS_ctx.color),
        icon: (entry.icon),
        side: (entry.side),
        avatar: (entry.avatar),
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            key: (index),
            title: (entry.title),
            subtitle: (entry.subtitle),
            body: (entry.body),
            color: (entry.color || __VLS_ctx.color),
            icon: (entry.icon),
            side: (entry.side),
            avatar: (entry.avatar),
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    // @ts-ignore
    [color, color, side, layout, isDark, entries,];
}
var __VLS_12 = {};
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_13 = __VLS_12;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
