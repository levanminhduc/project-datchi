declare var __VLS_9: {}, __VLS_12: {}, __VLS_15: {}, __VLS_17: {};
type __VLS_Slots = {} & {
    title?: (props: typeof __VLS_9) => any;
} & {
    subtitle?: (props: typeof __VLS_12) => any;
} & {
    body?: (props: typeof __VLS_15) => any;
} & {
    default?: (props: typeof __VLS_17) => any;
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
