/**
 * Thread Issue V2 Composable
 * Reactive state and operations for the simplified issue management system
 *
 * Key design:
 * - Frontend only displays data and collects input
 * - All calculations (issued_equivalent, quota check, stock check) are done by backend
 * - API calls only, no frontend business logic
 */
import type { IssueV2WithLines, IssueLineV2WithComputed, CreateIssueV2DTO, CreateIssueWithLineDTO, AddIssueLineV2DTO, ValidateIssueLineV2DTO, ValidateLineResponse, IssueV2Filters } from '@/types/thread/issueV2';
export declare function useIssueV2(): {
    currentIssue: any;
    issues: any;
    formData: any;
    validationResult: any;
    error: any;
    total: any;
    filters: any;
    isLoading: any;
    hasIssue: any;
    lines: any;
    threadTypes: any;
    isConfirmed: any;
    createIssue: (data: CreateIssueV2DTO) => Promise<import("@/types/thread/issueV2").CreateIssueV2Response>;
    createIssueWithFirstLine: (data: CreateIssueWithLineDTO) => Promise<IssueV2WithLines>;
    fetchIssue: (id: number) => Promise<void>;
    fetchIssues: (newFilters?: IssueV2Filters) => Promise<void>;
    loadFormData: (poId: number, styleId: number, colorId: number) => Promise<any>;
    validateLine: (data: ValidateIssueLineV2DTO) => Promise<ValidateLineResponse | null>;
    addLine: (data: AddIssueLineV2DTO) => Promise<IssueLineV2WithComputed | null>;
    removeLine: (lineId: number) => Promise<boolean>;
    updateLineNotes: (lineId: number, notes: string) => Promise<boolean>;
    confirmIssue: () => Promise<boolean>;
    clearIssue: () => void;
    clearError: () => void;
    clearValidation: () => void;
};
