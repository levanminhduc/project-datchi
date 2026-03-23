import type { StyleColor, CreateStyleColorDTO } from '@/types/thread';
export declare function useStyleColors(): {
    styleColors: any;
    activeStyleColors: any;
    isLoading: any;
    fetchStyleColors: (styleId: number) => Promise<void>;
    createStyleColor: (styleId: number, data: CreateStyleColorDTO) => Promise<StyleColor | null>;
    deleteStyleColor: (styleId: number, id: number) => Promise<boolean>;
};
