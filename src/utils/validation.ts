/**
 * Validation Rules
 * Compatible với Quasar input rules API
 */

/**
 * Validate format DD/MM/YYYY
 */
const formatRule = (val: string): boolean | string => {
  if (!val) return true
  return /^\d{2}\/\d{2}\/\d{4}$/.test(val) || 'Định dạng phải là DD/MM/YYYY'
}

/**
 * Validate ngày thực sự tồn tại (không 30/02, 31/04, etc.)
 */
const validRule = (val: string): boolean | string => {
  if (!val) return true
  const parts = val.split('/')
  if (parts.length !== 3) return 'Ngày không hợp lệ'

  const d = Number(parts[0])
  const m = Number(parts[1])
  const y = Number(parts[2])
  if (isNaN(d) || isNaN(m) || isNaN(y)) return 'Ngày không hợp lệ'

  const date = new Date(y, m - 1, d)
  const isValid = date.getFullYear() === y &&
                 date.getMonth() === m - 1 &&
                 date.getDate() === d

  return isValid || 'Ngày không hợp lệ'
}

/**
 * Combined rule: format + valid
 */
const dateRule = (val: string): boolean | string => {
  if (!val) return true
  const formatCheck = formatRule(val)
  if (formatCheck !== true) return formatCheck
  return validRule(val)
}

export const dateRules = {
  format: formatRule,
  valid: validRule,
  date: dateRule
}
