/**
 * Employee Management Composable
 *
 * Provides reactive state and CRUD operations for employee management
 * Follows patterns from useDialog.ts and useLoading.ts
 */
import type { Employee, EmployeeFormData } from '@/types';
export declare function useEmployees(): {
    employees: any;
    loading: any;
    error: any;
    selectedEmployee: any;
    hasEmployees: any;
    employeeCount: any;
    fetchEmployees: () => Promise<void>;
    createEmployee: (data: EmployeeFormData) => Promise<Employee | null>;
    updateEmployee: (id: number, data: Partial<EmployeeFormData>) => Promise<Employee | null>;
    deleteEmployee: (id: number) => Promise<boolean>;
    selectEmployee: (employee: Employee | null) => void;
    getEmployeeById: (id: number) => Employee | undefined;
    clearError: () => void;
    reset: () => void;
};
