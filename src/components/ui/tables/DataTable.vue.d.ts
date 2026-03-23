declare var __VLS_30: {}, __VLS_34: string | number, __VLS_35: any;
type __VLS_Slots = {} & {
    [K in NonNullable<typeof __VLS_34>]?: (props: typeof __VLS_35) => any;
} & {
    'empty-action'?: (props: typeof __VLS_30) => any;
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
