/**
 * Types for QR Label Printing functionality
 */
/** Size variants for QR code display */
export type QrCodeSize = 'small' | 'medium' | 'large';
/** QR code size in pixels */
export declare const QR_SIZE_MAP: Record<QrCodeSize, number>;
/** Label dimensions in mm */
export interface LabelDimensions {
    width: number;
    height: number;
}
/** Standard label size 50x30mm */
export declare const LABEL_SIZE: LabelDimensions;
/** A4 paper dimensions in mm */
export declare const A4_SIZE: LabelDimensions;
/** Grid layout for batch printing */
export interface LabelGridConfig {
    columns: number;
    rows: number;
    marginTop: number;
    marginLeft: number;
    gapX: number;
    gapY: number;
}
/** Default grid config for A4 paper with 50x30mm labels */
export declare const DEFAULT_GRID_CONFIG: LabelGridConfig;
/** Cone information for label display */
export interface ConeLabelData {
    cone_id: string;
    lot_number?: string;
    thread_type_code?: string;
    thread_type_name?: string;
    weight_grams?: number;
    quantity_meters?: number;
}
/** Props for ConeQrCode component */
export interface ConeQrCodeProps {
    coneId: string;
    size?: QrCodeSize;
    showText?: boolean;
}
/** Props for QrLabelSingle component */
export interface QrLabelSingleProps {
    cone: ConeLabelData;
    showBorder?: boolean;
}
/** Props for QrLabelGrid component */
export interface QrLabelGridProps {
    cones: ConeLabelData[];
    config?: LabelGridConfig;
}
/** Props for QrPrintDialog component */
export interface QrPrintDialogProps {
    modelValue: boolean;
    cones: ConeLabelData[];
    title?: string;
}
