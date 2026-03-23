/**
 * Weekly Order Composable
 *
 * Provides reactive state and CRUD operations for weekly thread orders.
 */
import type { ThreadOrderWeek, CreateWeeklyOrderDTO, UpdateWeeklyOrderDTO, WeeklyOrderResults, CalculationResult, AggregatedRow, ThreadOrderLoan, CreateLoanDTO } from '@/types/thread';
export declare function useWeeklyOrder(): {
    weeks: any;
    selectedWeek: any;
    loading: any;
    error: any;
    clearError: () => void;
    fetchWeeks: () => Promise<void>;
    createWeek: (dto: CreateWeeklyOrderDTO) => Promise<ThreadOrderWeek | null>;
    updateWeek: (id: number, dto: UpdateWeeklyOrderDTO) => Promise<ThreadOrderWeek | null>;
    deleteWeek: (id: number) => Promise<boolean>;
    loadWeek: (id: number) => Promise<ThreadOrderWeek | null>;
    saveResults: (weekId: number, calculationData: CalculationResult[], summaryData: AggregatedRow[]) => Promise<WeeklyOrderResults | null>;
    loadResults: (weekId: number) => Promise<WeeklyOrderResults | null>;
    createLoan: (toWeekId: number, dto: CreateLoanDTO) => Promise<ThreadOrderLoan | null>;
    fetchLoans: (weekId: number) => Promise<{
        all: ThreadOrderLoan[];
        given: ThreadOrderLoan[];
        received: ThreadOrderLoan[];
    } | null>;
};
