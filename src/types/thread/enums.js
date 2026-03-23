"use strict";
/**
 * Thread Management Enums
 *
 * These enums match database ENUMs exactly.
 * Do not modify values without corresponding database migration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryReceiptStatus = exports.DeliveryStatus = exports.OrderWeekStatus = exports.POStatus = exports.ThreadMaterial = exports.RecoveryStatus = exports.MovementType = exports.AllocationPriority = exports.AllocationStatus = exports.ConeStatus = void 0;
/**
 * Cone status tracking through the entire lifecycle
 * From receipt to consumption or write-off
 */
var ConeStatus;
(function (ConeStatus) {
    ConeStatus["RECEIVED"] = "RECEIVED";
    ConeStatus["INSPECTED"] = "INSPECTED";
    ConeStatus["AVAILABLE"] = "AVAILABLE";
    ConeStatus["RESERVED_FOR_ORDER"] = "RESERVED_FOR_ORDER";
    ConeStatus["SOFT_ALLOCATED"] = "SOFT_ALLOCATED";
    ConeStatus["HARD_ALLOCATED"] = "HARD_ALLOCATED";
    ConeStatus["IN_PRODUCTION"] = "IN_PRODUCTION";
    ConeStatus["PARTIAL_RETURN"] = "PARTIAL_RETURN";
    ConeStatus["PENDING_WEIGH"] = "PENDING_WEIGH";
    ConeStatus["CONSUMED"] = "CONSUMED";
    ConeStatus["WRITTEN_OFF"] = "WRITTEN_OFF";
    ConeStatus["QUARANTINE"] = "QUARANTINE";
})(ConeStatus || (exports.ConeStatus = ConeStatus = {}));
/**
 * Allocation status for order thread requests
 */
var AllocationStatus;
(function (AllocationStatus) {
    AllocationStatus["PENDING"] = "PENDING";
    AllocationStatus["SOFT"] = "SOFT";
    AllocationStatus["HARD"] = "HARD";
    AllocationStatus["ISSUED"] = "ISSUED";
    AllocationStatus["CANCELLED"] = "CANCELLED";
    AllocationStatus["WAITLISTED"] = "WAITLISTED";
    // Request workflow statuses
    AllocationStatus["APPROVED"] = "APPROVED";
    AllocationStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    AllocationStatus["RECEIVED"] = "RECEIVED";
    AllocationStatus["REJECTED"] = "REJECTED";
})(AllocationStatus || (exports.AllocationStatus = AllocationStatus = {}));
/**
 * Priority levels for allocation requests
 */
var AllocationPriority;
(function (AllocationPriority) {
    AllocationPriority["LOW"] = "LOW";
    AllocationPriority["NORMAL"] = "NORMAL";
    AllocationPriority["HIGH"] = "HIGH";
    AllocationPriority["URGENT"] = "URGENT";
})(AllocationPriority || (exports.AllocationPriority = AllocationPriority = {}));
/**
 * Types of inventory movements for audit trail
 */
var MovementType;
(function (MovementType) {
    MovementType["RECEIVE"] = "RECEIVE";
    MovementType["ISSUE"] = "ISSUE";
    MovementType["RETURN"] = "RETURN";
    MovementType["TRANSFER"] = "TRANSFER";
    MovementType["ADJUSTMENT"] = "ADJUSTMENT";
    MovementType["WRITE_OFF"] = "WRITE_OFF";
})(MovementType || (exports.MovementType = MovementType = {}));
/**
 * Recovery status for partial cone returns
 */
var RecoveryStatus;
(function (RecoveryStatus) {
    RecoveryStatus["INITIATED"] = "INITIATED";
    RecoveryStatus["PENDING_WEIGH"] = "PENDING_WEIGH";
    RecoveryStatus["WEIGHED"] = "WEIGHED";
    RecoveryStatus["CONFIRMED"] = "CONFIRMED";
    RecoveryStatus["WRITTEN_OFF"] = "WRITTEN_OFF";
    RecoveryStatus["REJECTED"] = "REJECTED";
})(RecoveryStatus || (exports.RecoveryStatus = RecoveryStatus = {}));
/**
 * Thread material types
 */
var ThreadMaterial;
(function (ThreadMaterial) {
    ThreadMaterial["POLYESTER"] = "POLYESTER";
    ThreadMaterial["COTTON"] = "COTTON";
    ThreadMaterial["NYLON"] = "NYLON";
    ThreadMaterial["SILK"] = "SILK";
    ThreadMaterial["RAYON"] = "RAYON";
    ThreadMaterial["MIXED"] = "MIXED";
})(ThreadMaterial || (exports.ThreadMaterial = ThreadMaterial = {}));
var POStatus;
(function (POStatus) {
    POStatus["PENDING"] = "PENDING";
    POStatus["CONFIRMED"] = "CONFIRMED";
    POStatus["IN_PRODUCTION"] = "IN_PRODUCTION";
    POStatus["COMPLETED"] = "COMPLETED";
    POStatus["CANCELLED"] = "CANCELLED";
})(POStatus || (exports.POStatus = POStatus = {}));
var OrderWeekStatus;
(function (OrderWeekStatus) {
    OrderWeekStatus["DRAFT"] = "DRAFT";
    OrderWeekStatus["CONFIRMED"] = "CONFIRMED";
    OrderWeekStatus["CANCELLED"] = "CANCELLED";
})(OrderWeekStatus || (exports.OrderWeekStatus = OrderWeekStatus = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "PENDING";
    DeliveryStatus["DELIVERED"] = "DELIVERED";
    DeliveryStatus["CANCELLED"] = "CANCELLED";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var InventoryReceiptStatus;
(function (InventoryReceiptStatus) {
    InventoryReceiptStatus["PENDING"] = "PENDING";
    InventoryReceiptStatus["PARTIAL"] = "PARTIAL";
    InventoryReceiptStatus["RECEIVED"] = "RECEIVED";
})(InventoryReceiptStatus || (exports.InventoryReceiptStatus = InventoryReceiptStatus = {}));
