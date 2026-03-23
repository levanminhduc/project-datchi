export interface UseScannerOptions {
    onScan?: (barcode: string) => void;
    minLength?: number;
    maxDelay?: number;
}
export declare function useScanner(options?: UseScannerOptions): {
    lastBarcode: any;
    isScanning: any;
    enabled: any;
    enable: () => void;
    disable: () => void;
    clear: () => void;
};
