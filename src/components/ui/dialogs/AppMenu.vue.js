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
var props = withDefaults(defineProps(), {
    items: function () { return []; },
    anchor: 'bottom end',
    self: 'top end',
    autoClose: true,
    contextMenu: false,
    touchPosition: false,
    maxHeight: '300px'
});
var emit = defineEmits();
var handleItemClick = function (item) {
    if (item.disable)
        return;
    if (item.onClick)
        item.onClick();
    emit('item-click', item);
};
var __VLS_defaults = {
    items: function () { return []; },
    anchor: 'bottom end',
    self: 'top end',
    autoClose: true,
    contextMenu: false,
    touchPosition: false,
    maxHeight: '300px'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qMenu | typeof __VLS_components.QMenu | typeof __VLS_components.qMenu | typeof __VLS_components.QMenu} */
qMenu;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ anchor: (props.anchor), self: (props.self), offset: (props.offset), autoClose: (props.autoClose), contextMenu: (props.contextMenu), touchPosition: (props.touchPosition) }, { style: ({ maxHeight: props.maxHeight }) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ anchor: (props.anchor), self: (props.self), offset: (props.offset), autoClose: (props.autoClose), contextMenu: (props.contextMenu), touchPosition: (props.touchPosition) }, { style: ({ maxHeight: props.maxHeight }) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    dense: true,
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var _loop_1 = function (item, index) {
    (index);
    if (item.separator) {
        var __VLS_13 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
        qSeparator;
        // @ts-ignore
        var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
        var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_14), false));
    }
    else {
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ 'onClick': {} }, { clickable: (!item.disable), disable: (item.disable), to: (item.to), href: (item.href), target: (item.href ? '_blank' : undefined) })));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: (!item.disable), disable: (item.disable), to: (item.to), href: (item.href), target: (item.href ? '_blank' : undefined) })], __VLS_functionalComponentArgsRest(__VLS_19), false));
        var __VLS_23 = void 0;
        var __VLS_24 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(item.separator))
                        return;
                    __VLS_ctx.handleItemClick(item);
                    // @ts-ignore
                    [items, handleItemClick,];
                } });
        __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign(__assign({}, __VLS_directiveBindingRestFields), { value: (props.autoClose) }), null, null);
        var __VLS_25 = __VLS_21.slots.default;
        if (item.icon) {
            var __VLS_26 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
                avatar: true,
            }));
            var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
                    avatar: true,
                }], __VLS_functionalComponentArgsRest(__VLS_27), false));
            var __VLS_31 = __VLS_29.slots.default;
            var __VLS_32 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                name: (item.icon),
            }));
            var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{
                    name: (item.icon),
                }], __VLS_functionalComponentArgsRest(__VLS_33), false));
            // @ts-ignore
            [vClosePopup,];
        }
        var __VLS_37 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
        var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_38), false));
        var __VLS_42 = __VLS_40.slots.default;
        (item.label);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
};
var __VLS_29, __VLS_40, __VLS_21, __VLS_22;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.items)); _i < _a.length; _i++) {
    var _b = _a[_i], item = _b[0], index = _b[1];
    _loop_1(item, index);
}
var __VLS_43 = {};
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_44 = __VLS_43;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
