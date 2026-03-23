/**
 * Employee API Service
 *
 * Handles all HTTP operations for employee management
 * Uses fetchApi for consistent error handling
 */
import type { Employee, EmployeeFormData } from '@/types';
export declare const employeeService: {
    /**
     * Lấy danh sách tất cả nhân viên
     * Uses limit=0 to fetch all records for virtual scroll
     * @returns Array of employees
     */
    getAll(): Promise<Employee[]>;
    /**
     * Lấy thông tin nhân viên theo ID
     * @param id - Employee ID
     * @returns Employee or null if not found
     */
    getById(id: number): Promise<Employee | null>;
    /**
     * Tạo nhân viên mới
     * @param data - Employee form data
     * @returns Created employee
     */
    create(data: EmployeeFormData): Promise<Employee>;
    /**
     * Cập nhật thông tin nhân viên
     * @param id - Employee ID
     * @param data - Partial employee data to update
     * @returns Updated employee
     */
    update(id: number, data: Partial<EmployeeFormData>): Promise<Employee>;
    /**
     * Xóa nhân viên
     * @param id - Employee ID
     */
    delete(id: number): Promise<void>;
    /**
     * Lấy số lượng nhân viên đang hoạt động
     * @returns Count of active employees
     */
    getActiveCount(): Promise<number>;
    /**
     * Lấy danh sách các bộ phận (departments) duy nhất
     * @returns Array of unique department names
     */
    getDepartments(): Promise<string[]>;
    resetPassword(id: number, newPassword: string): Promise<boolean>;
};
