import type { SubArt, ImportSubArtResult } from '@/types/thread/subArt';
export declare const subArtService: {
    getAllCodes(): Promise<string[]>;
    getByStyleId(styleId: number): Promise<SubArt[]>;
    importExcel(file: File): Promise<ImportSubArtResult>;
    downloadTemplate(): Promise<void>;
};
