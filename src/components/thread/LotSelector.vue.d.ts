declare var __VLS_77: string | number, __VLS_78: any;
type __VLS_Slots = {} & {
    [K in NonNullable<typeof __VLS_77>]?: (props: typeof __VLS_78) => any;
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
