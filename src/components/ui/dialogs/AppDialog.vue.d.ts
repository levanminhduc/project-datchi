declare var __VLS_23: {}, __VLS_41: {}, __VLS_49: {};
type __VLS_Slots = {} & {
    header?: (props: typeof __VLS_23) => any;
} & {
    default?: (props: typeof __VLS_41) => any;
} & {
    actions?: (props: typeof __VLS_49) => any;
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
