/**
 * Frontend Condition Evaluator
 * Evaluates field conditions locally without API calls
 */

import { FieldConditionRule } from '../services/api'

export function evaluateOperator(
  operator: string,
  fieldValue: any,
  conditionValue?: string
): boolean {
  // Handle empty checks
  if (operator === 'is_empty') {
    return fieldValue === null || fieldValue === undefined || fieldValue === '' || 
           (Array.isArray(fieldValue) && fieldValue.length === 0)
  }
  
  if (operator === 'is_not_empty') {
    return !(fieldValue === null || fieldValue === undefined || fieldValue === '' || 
             (Array.isArray(fieldValue) && fieldValue.length === 0))
  }

  if (fieldValue === null || fieldValue === undefined) {
    return false
  }

  // Convert to strings for comparison (case-insensitive)
  const fieldStr = String(fieldValue).toLowerCase()
  const conditionStr = conditionValue ? String(conditionValue).toLowerCase() : ''

  switch (operator) {
    case 'equals':
      return fieldStr === conditionStr
    
    case 'not_equals':
      return fieldStr !== conditionStr
    
    case 'contains':
      return conditionStr !== '' && fieldStr.includes(conditionStr)
    
    case 'not_contains':
      return conditionStr !== '' && !fieldStr.includes(conditionStr)
    
    case 'in':
      if (!conditionValue) return false
      const inValues = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return inValues.includes(fieldStr)
    
    case 'not_in':
      if (!conditionValue) return true
      const notInValues = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return !notInValues.includes(fieldStr)
    
    case 'greater_than':
    case 'less_than':
    case 'greater_equal':
    case 'less_equal':
      try {
        const fieldNum = parseFloat(String(fieldValue))
        const conditionNum = parseFloat(String(conditionValue || '0'))
        
        switch (operator) {
          case 'greater_than':
            return fieldNum > conditionNum
          case 'less_than':
            return fieldNum < conditionNum
          case 'greater_equal':
            return fieldNum >= conditionNum
          case 'less_equal':
            return fieldNum <= conditionNum
          default:
            return false
        }
      } catch {
        return false
      }
    
    default:
      return false
  }
}

export function evaluateFieldConditions(
  conditions: FieldConditionRule[],
  answers: Record<string, any>
): { show: boolean; hide: boolean; require: boolean; enable: boolean; disable: boolean; skip: boolean } {
  // Check what types of conditions exist
  const hasShowConditions = conditions.some(c => c.action === 'show')
  const hasHideConditions = conditions.some(c => c.action === 'hide')
  
  // Set default visibility based on condition types
  let result: { show: boolean; hide: boolean; require: boolean; enable: boolean; disable: boolean; skip: boolean }
  
  if (hasShowConditions && !hasHideConditions) {
    // Field should be hidden by default, shown only if condition is met
    result = {
      show: false,
      hide: true,
      enable: true,
      disable: false,
      require: false,
      skip: false
    }
  } else {
    // Default: visible (for hide conditions or no visibility conditions)
    result = {
      show: true,
      hide: false,
      enable: true,
      disable: false,
      require: false,
      skip: false
    }
  }

  // Evaluate all conditions - if ANY condition is met, apply its action
  for (const condition of conditions) {
    const sourceFieldValue = answers[condition.source_field_name]
    const conditionMet = evaluateOperator(
      condition.operator,
      sourceFieldValue,
      condition.value
    )

    if (conditionMet) {
      switch (condition.action) {
        case 'show':
          result.show = true
          result.hide = false
          break
        case 'hide':
          result.show = false
          result.hide = true
          break
        case 'enable':
          result.enable = true
          result.disable = false
          break
        case 'disable':
          result.enable = false
          result.disable = true
          break
        case 'require':
          result.require = true
          break
        case 'skip':
          result.skip = true
          break
      }
    }
  }

  return result
}

