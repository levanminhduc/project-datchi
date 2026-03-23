import type { DeliveryRecord, UpdateDeliveryDTO, DeliveryFilter, ReceiveDeliveryDTO } from '@/types/thread';
export interface AutoReturnDetail {
    loan_id: number;
    from_week_id: number;
    from_week_name: string;
    cones_returned: number;
    fully_settled: boolean;
}
interface ReceiveDeliveryResponse {
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
export declare const deliveryService: {
    getByWeek(weekId: number): Promise<DeliveryRecord[]>;
    update(deliveryId: number, dto: UpdateDeliveryDTO): Promise<DeliveryRecord>;
    getOverview(filters?: DeliveryFilter): Promise<DeliveryRecord[]>;
    receiveDelivery(deliveryId: number, dto: ReceiveDeliveryDTO): Promise<ReceiveDeliveryResponse>;
};
export {};
