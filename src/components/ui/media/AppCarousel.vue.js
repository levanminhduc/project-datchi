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
    slides: function () { return []; },
    vertical: false,
    autoplay: false,
    arrows: true,
    prevIcon: 'mdi-chevron-left',
    nextIcon: 'mdi-chevron-right',
    navigation: true,
    thumbnails: false,
    infinite: true,
    swipeable: true,
    animated: true,
    transitionPrev: 'slide-right',
    transitionNext: 'slide-left',
    transitionDuration: 300,
    height: '300px',
    controlColor: 'white'
});
var emit = defineEmits();
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var slideValue = (0, vue_1.computed)({
    get: function () { var _a; return (_a = props.modelValue) !== null && _a !== void 0 ? _a : 0; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    slides: function () { return []; },
    vertical: false,
    autoplay: false,
    arrows: true,
    prevIcon: 'mdi-chevron-left',
    nextIcon: 'mdi-chevron-right',
    navigation: true,
    thumbnails: false,
    infinite: true,
    swipeable: true,
    animated: true,
    transitionPrev: 'slide-right',
    transitionNext: 'slide-left',
    transitionDuration: 300,
    height: '300px',
    controlColor: 'white'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCarousel | typeof __VLS_components.QCarousel | typeof __VLS_components.qCarousel | typeof __VLS_components.QCarousel} */
qCarousel;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.slideValue),
    vertical: (__VLS_ctx.vertical),
    autoplay: (__VLS_ctx.autoplay),
    arrows: (__VLS_ctx.arrows),
    prevIcon: (__VLS_ctx.prevIcon),
    nextIcon: (__VLS_ctx.nextIcon),
    navigation: (__VLS_ctx.navigation),
    thumbnails: (__VLS_ctx.thumbnails),
    infinite: (__VLS_ctx.infinite),
    swipeable: (__VLS_ctx.swipeable),
    animated: (__VLS_ctx.animated),
    transitionPrev: (__VLS_ctx.transitionPrev),
    transitionNext: (__VLS_ctx.transitionNext),
    transitionDuration: (__VLS_ctx.transitionDuration),
    dark: (__VLS_ctx.isDark),
    height: (__VLS_ctx.height),
    controlColor: (__VLS_ctx.controlColor),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.slideValue),
        vertical: (__VLS_ctx.vertical),
        autoplay: (__VLS_ctx.autoplay),
        arrows: (__VLS_ctx.arrows),
        prevIcon: (__VLS_ctx.prevIcon),
        nextIcon: (__VLS_ctx.nextIcon),
        navigation: (__VLS_ctx.navigation),
        thumbnails: (__VLS_ctx.thumbnails),
        infinite: (__VLS_ctx.infinite),
        swipeable: (__VLS_ctx.swipeable),
        animated: (__VLS_ctx.animated),
        transitionPrev: (__VLS_ctx.transitionPrev),
        transitionNext: (__VLS_ctx.transitionNext),
        transitionDuration: (__VLS_ctx.transitionDuration),
        dark: (__VLS_ctx.isDark),
        height: (__VLS_ctx.height),
        controlColor: (__VLS_ctx.controlColor),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.slides)); _i < _a.length; _i++) {
    var _b = _a[_i], slide = _b[0], index = _b[1];
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCarouselSlide | typeof __VLS_components.QCarouselSlide | typeof __VLS_components.qCarouselSlide | typeof __VLS_components.QCarouselSlide} */
    qCarouselSlide;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        key: (index),
        name: (index),
        imgSrc: (slide.src),
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            key: (index),
            name: (index),
            imgSrc: (slide.src),
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    var __VLS_12 = __VLS_10.slots.default;
    if (slide.caption) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-bottom custom-caption" }));
        /** @type {__VLS_StyleScopedClasses['absolute-bottom']} */ ;
        /** @type {__VLS_StyleScopedClasses['custom-caption']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
        (slide.caption);
    }
    // @ts-ignore
    [slideValue, vertical, autoplay, arrows, prevIcon, nextIcon, navigation, thumbnails, infinite, swipeable, animated, transitionPrev, transitionNext, transitionDuration, isDark, height, controlColor, slides,];
    var __VLS_10;
    // @ts-ignore
    [];
}
var __VLS_13 = {};
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_14 = __VLS_13;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
