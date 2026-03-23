export interface SubArt {
    id: number;
    style_id: number;
    sub_art_code: string;
    created_at: string;
}
export interface ImportSubArtResult {
    imported: number;
    skipped: number;
    warnings_count: number;
    warnings: Array<{
        row: number;
        style_code: string;
        sub_art_code: string;
        reason: string;
    }>;
}
