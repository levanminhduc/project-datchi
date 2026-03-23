declare var __VLS_8: {}, __VLS_16: {}, __VLS_18: {}, __VLS_20: {};
type __VLS_Slots = {} & {
    left?: (props: typeof __VLS_8) => any;
} & {
    title?: (props: typeof __VLS_16) => any;
} & {
    default?: (props: typeof __VLS_18) => any;
} & {
    right?: (props: typeof __VLS_20) => any;
};
declare const __VLS_base: any;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
