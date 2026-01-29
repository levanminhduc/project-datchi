/**
 * Position Type Definitions
 * 
 * For Chức Vụ (Position) dropdown in employee management
 * Positions are stored as plain strings in employees.chuc_vu column
 */

/**
 * Option format for dropdown select
 */
export interface PositionOption {
  label: string  // Display text (same as value for chuc_vu)
  value: string  // The position value from chuc_vu column
}
