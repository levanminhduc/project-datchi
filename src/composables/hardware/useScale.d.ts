export interface ScaleReading {
    weight: number;
    stable: boolean;
    unit: 'g' | 'kg';
    timestamp: Date;
}
interface SerialPort {
    readable: ReadableStream | null;
    writable: WritableStream | null;
    open(options: {
        baudRate: number;
    }): Promise<void>;
    close(): Promise<void>;
}
interface Serial {
    requestPort(): Promise<SerialPort>;
}
declare global {
    interface Navigator {
        serial?: Serial;
    }
}
export declare function useScale(): {
    isSupported: any;
    isConnected: any;
    isConnecting: any;
    currentWeight: any;
    isStable: any;
    error: any;
    readings: any;
    connect: () => Promise<boolean>;
    disconnect: () => Promise<void>;
    capture: () => number | null;
    tare: () => Promise<void>;
};
export {};
