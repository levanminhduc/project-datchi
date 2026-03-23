/**
 * Thread Types Management Composable
 *
 * Provides reactive state and CRUD operations for thread type management.
 * Follows patterns from useEmployees.ts
 */
import type { ThreadType, ThreadTypeFormData, ThreadTypeFilters } from '@/types/thread';
export declare function useThreadTypes(): {
    threadTypes: any;
    loading: any;
    error: any;
    selectedThreadType: any;
    filters: any;
    hasThreadTypes: any;
    threadTypeCount: any;
    activeThreadTypes: any;
    fetchThreadTypes: (newFilters?: ThreadTypeFilters) => Promise<void>;
    createThreadType: (data: ThreadTypeFormData) => Promise<ThreadType | null>;
    updateThreadType: (id: number, data: Partial<ThreadTypeFormData>) => Promise<ThreadType | null>;
    deleteThreadType: (id: number) => Promise<boolean>;
    selectThreadType: (threadType: ThreadType | null) => void;
    getThreadTypeById: (id: number) => ThreadType | undefined;
    setFilters: (newFilters: ThreadTypeFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
};
