declare var __VLS_9: {}, __VLS_11: {}, __VLS_14: {};
type __VLS_Slots = {} & {
    avatar?: (props: typeof __VLS_9) => any;
} & {
    default?: (props: typeof __VLS_11) => any;
} & {
    action?: (props: typeof __VLS_14) => any;
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
