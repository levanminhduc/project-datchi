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
var openLink = function (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
};
var links = [
    {
        href: 'https://quasar.dev/',
        icon: 'description',
        subtitle: 'Learn about all things Quasar in our documentation.',
        title: 'Documentation',
    },
    {
        href: 'https://quasar.dev/start/vite-plugin',
        icon: 'star_outline',
        subtitle: 'Explore available framework Features.',
        title: 'Features',
    },
    {
        href: 'https://quasar.dev/vue-components',
        icon: 'widgets',
        subtitle: 'Discover components in the API Explorer.',
        title: 'Components',
    },
    {
        href: 'https://discord.gg/5TDhbDg',
        icon: 'groups',
        subtitle: 'Connect with Quasar developers.',
        title: 'Community',
    },
];
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['hover-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "container q-pa-lg" }));
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-center column q-mb-xl" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xl']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qImg | typeof __VLS_components.QImg} */
qImg;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ src: "@/assets/logo.png", width: "150px" }, { class: "q-mb-md" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ src: "@/assets/logo.png", width: "150px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h2 text-weight-bold q-my-none" }));
/** @type {__VLS_StyleScopedClasses['text-h2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5(__assign({ flat: true, bordered: true }, { class: "q-pa-lg bg-primary-1" })));
var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-pa-lg bg-primary-1" })], __VLS_functionalComponentArgsRest(__VLS_6), false));
/** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary-1']} */ ;
var __VLS_10 = __VLS_8.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_11;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign({ name: "rocket_launch", size: "32px", color: "primary" }, { class: "q-mr-md" })));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign({ name: "rocket_launch", size: "32px", color: "primary" }, { class: "q-mr-md" })], __VLS_functionalComponentArgsRest(__VLS_12), false));
/** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)(__assign({ class: "text-h5 text-weight-bold q-my-none" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body2 text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.kbd, __VLS_intrinsics.kbd)({});
var __VLS_8;
var _loop_1 = function (link) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (link.href) }, { class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_16 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16(__assign(__assign({ 'onClick': {} }, { flat: true, bordered: true }), { class: "q-pa-lg full-height cursor-pointer hover-card" })));
    var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, bordered: true }), { class: "q-pa-lg full-height cursor-pointer hover-card" })], __VLS_functionalComponentArgsRest(__VLS_17), false));
    var __VLS_21 = void 0;
    var __VLS_22 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openLink(link.href);
                // @ts-ignore
                [links, openLink,];
            } });
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-height']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover-card']} */ ;
    var __VLS_23 = __VLS_19.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center" }));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ color: "primary", textColor: "white" }, { class: "q-mr-md" })));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ color: "primary", textColor: "white" }, { class: "q-mr-md" })], __VLS_functionalComponentArgsRest(__VLS_25), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
        name: (link.icon),
    }));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{
            name: (link.icon),
        }], __VLS_functionalComponentArgsRest(__VLS_31), false));
    // @ts-ignore
    [];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex-grow-1" }));
    /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)(__assign({ class: "text-h6 text-weight-bold q-my-none" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
    (link.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body2 text-grey-7 q-mb-none" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
    (link.subtitle);
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        name: "open_in_new",
        color: "grey-5",
    }));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{
            name: "open_in_new",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_36), false));
    // @ts-ignore
    [];
    // @ts-ignore
    [];
};
var __VLS_27, __VLS_19, __VLS_20;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.links)); _i < _a.length; _i++) {
    var link = _a[_i][0];
    _loop_1(link);
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
