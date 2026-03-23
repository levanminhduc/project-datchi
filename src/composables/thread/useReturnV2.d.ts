/**
 * Thread Return V2 Composable
 * Nhap lai chi - Return Thread Cones
 *
 * Provides API calls for returning issued thread cones.
 * IMPORTANT: This composable only makes API calls and displays results.
 * All calculations are done by the backend.
 */
import type { IssueV2WithLines } from '@/types/thread/issueV2';
/**
 * Return line input from user
 */
export interface ReturnLineInput {
    line_id: number;
    returned_full: number;
    returned_partial: number;
}
export declare function useReturnV2(): {
    confirmedIssues: any;
    selectedIssue: any;
    returnLogs: any;
    error: any;
    isLoading: any;
    hasConfirmedIssues: any;
    loadConfirmedIssues: () => Promise<void>;
    loadIssueDetails: (issueId: number) => Promise<void>;
    loadReturnLogs: (issueId: number) => Promise<void>;
    submitReturn: (issueId: number, lines: ReturnLineInput[]) => Promise<boolean>;
    clearError: () => void;
    clearSelectedIssue: () => void;
    validateReturnQuantities: (lines: ReturnLineInput[], issueLines: IssueV2WithLines["lines"]) => {
        valid: boolean;
        errors: string[];
    };
};
