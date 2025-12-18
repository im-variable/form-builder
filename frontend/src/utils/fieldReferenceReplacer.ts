/**
 * Utility function to replace @fieldname and @#fieldid placeholders in text with actual field values
 * This is used for paragraph fields that reference other field values
 */

export function replaceFieldReferences(
  text: string,
  answers: Record<string, any>,
  fields: Array<{ id?: number; name: string; field_type: string; options?: Record<string, any> }>
): string {
  if (!text) return text

  // Find all @#fieldid patterns (e.g., @#1, @#7) and @fieldname patterns
  const idPattern = /@#(\d+)/g
  const namePattern = /@(\w+)/g
  
  const idMatches = Array.from(text.matchAll(idPattern))
  const nameMatches = Array.from(text.matchAll(namePattern))
  
  // Filter out name matches that are actually ID matches (avoid double processing)
  const nameMatchesFiltered = nameMatches.filter(match => {
    const matchText = match[0]
    return !matchText.startsWith('@#')
  })

  if (idMatches.length === 0 && nameMatchesFiltered.length === 0) return text

  // Create maps for field lookup by ID and name
  const fieldByIdMap: Record<number, { name: string; field_type: string; options?: Record<string, any> }> = {}
  const fieldByNameMap: Record<string, { name: string; field_type: string; options?: Record<string, any> }> = {}
  
  fields.forEach((field) => {
    if (field.id !== undefined) {
      fieldByIdMap[field.id] = { name: field.name, field_type: field.field_type, options: field.options }
    }
    fieldByNameMap[field.name] = { name: field.name, field_type: field.field_type, options: field.options }
  })

  let result = text
  
  // Helper function to format field value
  const formatFieldValue = (
    value: any,
    field: { name: string; field_type: string; options?: Record<string, any> }
  ): string => {
    const fieldType = field.field_type
    
    if (value === null || value === undefined || value === '') {
      return 'N/A' // Empty value - show N/A
    } else if (fieldType === 'boolean') {
      return value === true || value === 'true' || String(value).toLowerCase() === 'true' ? 'Yes' : 'No'
    } else if (fieldType === 'checkbox' || fieldType === 'multiselect') {
      // Parse comma-separated string back to array
      let valueList: string[] = []
      if (typeof value === 'string' && value && value.trim()) {
        valueList = value.split(',').map((v) => v.trim()).filter((v) => v)
      } else if (Array.isArray(value) && value.length > 0) {
        valueList = value.map((v) => String(v)).filter((v) => v)
      } else if (value) {
        valueList = [String(value)]
      }
      
      if (valueList.length === 0) {
        return 'N/A'
      } else {
        // Map values to display labels if options exist
        if (field?.options && field.options.choices && Array.isArray(field.options.choices)) {
          const choicesMap: Record<string, string> = {}
          field.options.choices.forEach((choice: any) => {
            if (choice && choice.value !== undefined && choice.value !== null) {
              const key = String(choice.value)
              choicesMap[key] = choice.label || key
            }
          })
          return valueList.map((v) => {
            const trimmed = String(v).trim()
            return choicesMap[trimmed] || choicesMap[String(v)] || v
          }).join(', ')
        } else {
          return valueList.join(', ')
        }
      }
    } else if (fieldType === 'radio' || fieldType === 'select') {
      // Map value to display label
      const valueStr = String(value).trim()
      
      if (field?.options && field.options.choices && Array.isArray(field.options.choices)) {
        // Try exact match first, then try with String conversion
        const choice = field.options.choices.find((c: any) => {
          if (!c || c.value === undefined || c.value === null) return false
          const choiceValueStr = String(c.value).trim()
          return choiceValueStr === valueStr || String(c.value) === valueStr || String(c.value) === String(value)
        })
        
        if (choice) {
          return choice.label || String(choice.value)
        } else {
          return valueStr
        }
      } else {
        return valueStr
      }
    } else if (Array.isArray(value)) {
      return value.map((v) => String(v)).join(', ')
    } else {
      return String(value)
    }
  }
  
  // Process ID-based references first (@#fieldid)
  idMatches.forEach((match) => {
    const fieldIdStr = match[1] // e.g., "1" from "@#1"
    const fieldId = parseInt(fieldIdStr, 10)
    
    // Look up field by ID
    const field = fieldByIdMap[fieldId]
    
    if (!field) {
      return
    }
    
    // Get value using field name (answers are keyed by field name)
    const fieldName = field.name
    const value = answers[fieldName]
    
    if (value === undefined || value === null) {
      // Field found but no value - replace with N/A
      result = result.replace(new RegExp(`@#${fieldIdStr}`, 'g'), 'N/A')
      return
    }
    
    const displayValue = formatFieldValue(value, field)
    
    // Replace all occurrences of @#fieldid with the value
    result = result.replace(new RegExp(`@#${fieldIdStr}`, 'g'), displayValue)
  })
  
  // Process name-based references (@fieldname)
  nameMatchesFiltered.forEach((match) => {
    const fieldName = match[1] // e.g., "email" from "@email"
    
    // Check if field exists in answers
    if (!(fieldName in answers)) {
      // Field not found in answers - leave placeholder as is
      return
    }

    const value = answers[fieldName]
    const field = fieldByNameMap[fieldName]
    
    if (!field) {
      return
    }
    
    const displayValue = formatFieldValue(value, field)
    
    // Replace all occurrences of this @fieldname with the value
    result = result.replace(new RegExp(`@${fieldName}`, 'g'), displayValue)
  })

  return result
}

