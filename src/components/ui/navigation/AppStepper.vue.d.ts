declare var __VLS_15: `step-${any}`, __VLS_16: {
    step: any;
}, __VLS_18: {}, __VLS_21: {};
type __VLS_Slots = {} & {
    [K in NonNullable<typeof __VLS_15>]?: (props: typeof __VLS_16) => any;
} & {
    default?: (props: typeof __VLS_18) => any;
} & {
    navigation?: (props: typeof __VLS_21) => any;
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
