/**
 * Employee Management Composable
 * 
 * Provides reactive state and CRUD operations for employee management
 * Follows patterns from useDialog.ts and useLoading.ts
 */

import { ref, computed } from 'vue'
import { employeeService } from '@/services/employeeService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'
import { createErrorHandler } from '@/utils/errorMessages'
import type { Employee, EmployeeFormData } from '@/types'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  CREATE_SUCCESS: 'Thêm nhân viên thành công',
  UPDATE_SUCCESS: 'Cập nhật thành công',
  DELETE_SUCCESS: 'Xóa nhân viên thành công',
}

/**
 * Domain-specific error handler for employee operations
 */
const getErrorMessage = createErrorHandler({
  duplicate: 'Mã nhân viên đã tồn tại',
  notFound: 'Không tìm thấy nhân viên',
})

export function useEmployees() {
  // State
  const employees = ref<Employee[]>([])
  const error = ref<string | null>(null)
  const selectedEmployee = ref<Employee | null>(null)
  
  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasEmployees = computed(() => employees.value.length > 0)
  const employeeCount = computed(() => employees.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all employees from API
   */
  const fetchEmployees = async (): Promise<void> => {
    clearError()
    
    try {
      const data = await loading.withLoading(async () => {
        return await employeeService.getAll()
      })
      
      employees.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useEmployees] fetchEmployees error:', err)
    }
  }

  /**
   * Create a new employee
   * @param data - Employee form data
   * @returns Created employee or null on error
   */
  const createEmployee = async (data: EmployeeFormData): Promise<Employee | null> => {
    clearError()
    
    try {
      const newEmployee = await loading.withLoading(async () => {
        return await employeeService.create(data)
      })
      
      // Add to local state
      employees.value = [...employees.value, newEmployee]
      snackbar.success(MESSAGES.CREATE_SUCCESS)
      
      return newEmployee
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useEmployees] createEmployee error:', err)
      
      return null
    }
  }

  /**
   * Update an existing employee
   * @param id - Employee ID
   * @param data - Partial employee data to update
   * @returns Updated employee or null on error
   */
  const updateEmployee = async (
    id: number,
    data: Partial<EmployeeFormData>
  ): Promise<Employee | null> => {
    clearError()
    
    try {
      const updatedEmployee = await loading.withLoading(async () => {
        return await employeeService.update(id, data)
      })
      
      // Update local state
      employees.value = employees.value.map((emp) =>
        emp.id === id ? updatedEmployee : emp
      )
      
      // Update selected if it was the one updated
      if (selectedEmployee.value?.id === id) {
        selectedEmployee.value = updatedEmployee
      }
      
      snackbar.success(MESSAGES.UPDATE_SUCCESS)
      
      return updatedEmployee
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useEmployees] updateEmployee error:', err)
      
      return null
    }
  }

  /**
   * Delete an employee
   * @param id - Employee ID
   * @returns true if successful, false on error
   */
  const deleteEmployee = async (id: number): Promise<boolean> => {
    clearError()
    
    try {
      await loading.withLoading(async () => {
        await employeeService.delete(id)
      })
      
      // Remove from local state
      employees.value = employees.value.filter((emp) => emp.id !== id)
      
      // Clear selected if it was the one deleted
      if (selectedEmployee.value?.id === id) {
        selectedEmployee.value = null
      }
      
      snackbar.success(MESSAGES.DELETE_SUCCESS)
      
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useEmployees] deleteEmployee error:', err)
      
      return false
    }
  }

  /**
   * Select an employee for viewing/editing
   * @param employee - Employee to select, or null to deselect
   */
  const selectEmployee = (employee: Employee | null): void => {
    selectedEmployee.value = employee
  }

  /**
   * Find an employee by ID from local state
   * @param id - Employee ID
   * @returns Employee or undefined if not found
   */
  const getEmployeeById = (id: number): Employee | undefined => {
    return employees.value.find((emp) => emp.id === id)
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    employees.value = []
    error.value = null
    selectedEmployee.value = null
    loading.reset()
  }

  return {
    // State
    employees,
    loading: isLoading,
    error,
    selectedEmployee,
    
    // Computed
    hasEmployees,
    employeeCount,
    
    // Methods
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    selectEmployee,
    getEmployeeById,
    clearError,
    reset,
  }
}
