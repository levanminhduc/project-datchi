declare var __VLS_13: {}, __VLS_15: {};
type __VLS_Slots = {} & {
    breadcrumbs?: (props: typeof __VLS_13) => any;
} & {
    actions?: (props: typeof __VLS_15) => any;
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
