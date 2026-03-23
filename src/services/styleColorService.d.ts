import type { StyleColor, CreateStyleColorDTO } from '@/types/thread';
export declare const styleColorService: {
    getByStyleId(styleId: number): Promise<StyleColor[]>;
    create(styleId: number, data: CreateStyleColorDTO): Promise<StyleColor>;
    update(styleId: number, id: number, data: Partial<CreateStyleColorDTO & {
        is_active: boolean;
    }>): Promise<StyleColor>;
    remove(styleId: number, id: number): Promise<void>;
};
