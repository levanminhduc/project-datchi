/**
 * Issue V2 Service
 * API client for simplified issue management (quantity-based tracking)
 *
 * Uses fetchApi for consistent error handling.
 * All business logic is handled by the backend; this service only makes API calls.
 */
import type { IssueV2, IssueV2WithLines, CreateIssueV2DTO, CreateIssueV2Response, CreateIssueWithLineDTO, AddIssueLineV2DTO, ValidateIssueLineV2DTO, ValidateLineResponse, IssueFormData, IssueV2Filters, IssueV2ListResponse, IssueLineV2WithComputed, ReturnIssueV2DTO, OrderOptionsResponse } from '@/types/thread/issueV2';
export declare const issueV2Service: {
    /**
     * Tao phieu xuat moi (Create new issue)
     * @param data - CreateIssueV2DTO with department, created_by
     * @returns Created issue ID and code
     */
    create(data: CreateIssueV2DTO): Promise<CreateIssueV2Response>;
    createWithFirstLine(data: CreateIssueWithLineDTO): Promise<IssueV2WithLines>;
    /**
     * Lay chi tiet phieu xuat (Get issue by ID with lines)
     * @param id - Issue ID
     * @returns Issue with all lines including computed fields
     */
    getById(id: number): Promise<IssueV2WithLines>;
    /**
     * Lay danh sach phieu xuat (List issues with filters)
     * @param filters - Optional filters
     * @returns Paginated list of issues
     */
    list(filters?: IssueV2Filters): Promise<IssueV2ListResponse>;
    /**
     * Lay danh sach options cho cascading dropdown (PO -> Style -> Color)
     * Chi tra ve cac PO/Style/Color tu don hang tuan da xac nhan
     * @param poId - Optional: filter styles by PO
     * @param styleId - Optional: filter colors by style (requires poId)
     * @returns Array of PO options, Style options, or Color options
     */
    getOrderOptions(poId?: number, styleId?: number): Promise<OrderOptionsResponse>;
    /**
     * Lay du lieu form (Load thread types with quota & stock for a PO/Style/Color)
     * @param poId - Purchase Order ID
     * @param styleId - Style ID
     * @param colorId - Color ID
     * @returns Thread types with quota and stock info
     */
    getFormData(poId: number, styleId: number, colorId: number): Promise<IssueFormData>;
    /**
     * Them dong vao phieu xuat (Add line to issue)
     * @param issueId - Issue ID
     * @param data - AddIssueLineV2DTO
     * @returns Added line with computed fields
     */
    addLine(issueId: number, data: AddIssueLineV2DTO): Promise<IssueLineV2WithComputed>;
    /**
     * Kiem tra dong truoc khi them (Validate line before adding)
     * Backend computes issued_equivalent, checks quota/stock
     * @param issueId - Issue ID
     * @param data - ValidateIssueLineV2DTO
     * @returns Validation result with computed fields
     */
    validateLine(issueId: number | undefined, data: ValidateIssueLineV2DTO): Promise<ValidateLineResponse>;
    /**
     * Xac nhan phieu xuat (Confirm issue and deduct stock)
     * @param issueId - Issue ID
     * @param idempotencyKey - UUID for idempotent request
     * @returns Updated issue with CONFIRMED status
     */
    confirm(issueId: number, idempotencyKey?: string): Promise<IssueV2WithLines>;
    /**
     * Xoa dong khoi phieu xuat (Remove line from issue)
     * @param issueId - Issue ID
     * @param lineId - Line ID
     */
    removeLine(issueId: number, lineId: number): Promise<void>;
    deleteIssue(id: number): Promise<void>;
    /**
     * Cap nhat ghi chu dong (Update line notes)
     * @param issueId - Issue ID
     * @param lineId - Line ID
     * @param notes - Over quota notes
     * @returns Updated line
     */
    updateLineNotes(issueId: number, lineId: number, notes: string): Promise<IssueLineV2WithComputed>;
    /**
     * Tra hang va them lai ton kho (Return items and add stock back)
     * @param issueId - Issue ID
     * @param data - ReturnIssueV2DTO with lines to return
     * @param idempotencyKey - UUID for idempotent request
     * @returns Updated issue
     */
    returnItems(issueId: number, data: ReturnIssueV2DTO, idempotencyKey?: string): Promise<IssueV2>;
};
