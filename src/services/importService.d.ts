import type { ImportMappingConfig, ImportTexRow, ImportTexResponse, ImportColorRow, ImportColorResponse, ImportStreamEvent, POImportPreview, POImportResult } from '@/types/thread';
export declare const importService: {
    getSupplierTexMapping(): Promise<ImportMappingConfig>;
    getSupplierColorMapping(): Promise<ImportMappingConfig>;
    previewSupplierTex(rows: ImportTexRow[]): Promise<ImportTexRow[]>;
    importSupplierTex(rows: ImportTexRow[]): Promise<ImportTexResponse>;
    importSupplierColors(supplierId: number, rows: ImportColorRow[]): Promise<ImportColorResponse>;
    importSupplierColorsStream(supplierId: number, rows: ImportColorRow[], onProgress: (event: ImportStreamEvent) => void): Promise<ImportColorResponse>;
    downloadTexTemplate(): Promise<void>;
    downloadColorTemplate(): Promise<void>;
    getPOImportMapping(): Promise<ImportMappingConfig>;
    parsePOItems(rows: Array<{
        row_number: number;
        customer_name?: string;
        po_number: string;
        style_code: string;
        week?: string;
        description?: string;
        finished_product_code?: string;
        quantity: number;
    }>): Promise<POImportPreview>;
    executePOImport(validRows: POImportPreview["valid_rows"]): Promise<POImportResult>;
    downloadPOTemplate(): Promise<void>;
};
