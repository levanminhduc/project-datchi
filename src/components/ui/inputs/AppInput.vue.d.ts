declare var __VLS_13: {}, __VLS_21: {}, __VLS_36: {}, __VLS_39: {}, __VLS_41: {};
type __VLS_Slots = {} & {
    prepend?: (props: typeof __VLS_13) => any;
} & {
    append?: (props: typeof __VLS_21) => any;
} & {
    before?: (props: typeof __VLS_36) => any;
} & {
    after?: (props: typeof __VLS_39) => any;
} & {
    default?: (props: typeof __VLS_41) => any;
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
