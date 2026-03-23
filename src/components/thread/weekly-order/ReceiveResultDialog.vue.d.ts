import type { AutoReturnDetail } from '@/services/deliveryService';
export interface ReceiveResult {
    cones_created: number;
    cones_reserved: number;
    remaining_shortage: number;
    lot_number: string;
    auto_return: {
        settled: number;
        returned_cones: number;
        details: AutoReturnDetail[];
    };
}
declare const __VLS_export: any;
declare const _default: typeof __VLS_export;
export default _default;
