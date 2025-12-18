/**
 * Utility function to replace @fieldname placeholders in text with actual field values
 * This is used for paragraph fields that reference other field values
 */

export function replaceFieldReferences(
  text: string,
  answers: Record<string, any>,
  fields: Array<{ name: string; field_type: string }>
): string {
  if (!text) return text

  // Find all @fieldname patterns
  const pattern = /@(\w+)/g
  const matches = Array.from(text.matchAll(pattern))

  if (matches.length === 0) return text

  // Create a map of field names to field types for formatting
  const fieldTypeMap: Record<string, string> = {}
  fields.forEach((field) => {
    fieldTypeMap[field.name] = field.field_type
  })

  let result = text
  matches.forEach((match) => {
    const fieldName = match[1]
    const fullMatch = match[0] // The full @fieldname match

    if (fieldName in answers) {
      const value = answers[fieldName]
      const fieldType = fieldTypeMap[fieldName]

      // Format the value based on field type
      let displayValue = ''
      if (value === null || value === undefined || value === '') {
        displayValue = ''
      } else if (fieldType === 'boolean') {
        displayValue = value === true || value === 'true' || String(value).toLowerCase() === 'true' ? 'Yes' : 'No'
      } else if (Array.isArray(value)) {
        displayValue = value.map((v) => String(v)).join(', ')
      } else {
        displayValue = String(value)
      }

      // Replace all occurrences of this @fieldname with the value
      result = result.replace(new RegExp(`@${fieldName}`, 'g'), displayValue)
    }
  })

  return result
}

