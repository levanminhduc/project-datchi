"use strict";
/**
 * Thread Issue V2 Types
 * Types for the simplified issue management system
 *
 * Key changes from V1:
 * - Quantity-based tracking (full cones + partial cones) instead of meters
 * - Multi-line issues (one issue can have multiple thread types)
 * - Quota in cones from thread_order_items
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueV2Status = void 0;
// ============================================================================
// Enums
// ============================================================================
/**
 * Issue V2 status matching database ENUM
 */
var IssueV2Status;
(function (IssueV2Status) {
    IssueV2Status["DRAFT"] = "DRAFT";
    IssueV2Status["CONFIRMED"] = "CONFIRMED";
    IssueV2Status["RETURNED"] = "RETURNED";
})(IssueV2Status || (exports.IssueV2Status = IssueV2Status = {}));
