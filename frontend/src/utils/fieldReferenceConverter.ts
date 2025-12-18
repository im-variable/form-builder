/**
 * Utility functions to convert between @#fieldid and @fieldname formats
 * - @#fieldid: Used in database storage (reliable, case-insensitive)
 * - @fieldname: Used in UI for user-friendly editing
 */

/**
 * Convert @#fieldid patterns to @fieldname patterns for UI display
 * @param text Text containing @#fieldid patterns
 * @param fields Array of fields with id and name properties
 * @returns Text with @#fieldid replaced by @fieldname
 */
export function convertFieldIdsToNames(
  text: string,
  fields: Array<{ id: number; name: string }>
): string {
  if (!text) return text

  // Create a map of field ID to field name
  const fieldIdToNameMap: Record<number, string> = {}
  fields.forEach((field) => {
    if (field.id !== undefined && field.name) {
      fieldIdToNameMap[field.id] = field.name
    }
  })

  // Find all @#fieldid patterns and replace with @fieldname
  const idPattern = /@#(\d+)/g
  let result = text

  const matches = Array.from(text.matchAll(idPattern))
  matches.forEach((match) => {
    const fieldIdStr = match[1]
    const fieldId = parseInt(fieldIdStr, 10)
    const fieldName = fieldIdToNameMap[fieldId]

    if (fieldName) {
      // Replace @#fieldid with @fieldname
      result = result.replace(new RegExp(`@#${fieldIdStr}`, 'g'), `@${fieldName}`)
    }
  })

  return result
}

/**
 * Convert @fieldname patterns to @#fieldid patterns for database storage
 * @param text Text containing @fieldname patterns
 * @param fields Array of fields with id and name properties
 * @returns Text with @fieldname replaced by @#fieldid
 */
export function convertFieldNamesToIds(
  text: string,
  fields: Array<{ id: number; name: string }>
): string {
  if (!text) return text

  // Create a map of field name (case-insensitive) to field ID
  const fieldNameToIdMap: Record<string, number> = {}
  const fieldNameCaseMap: Record<string, string> = {} // Preserve original case

  fields.forEach((field) => {
    if (field.id !== undefined && field.name) {
      const nameLower = field.name.toLowerCase()
      fieldNameToIdMap[nameLower] = field.id
      fieldNameCaseMap[nameLower] = field.name
    }
  })

  // Find all @fieldname patterns (but not @#fieldid)
  const namePattern = /@(\w+)/g
  let result = text

  const matches = Array.from(text.matchAll(namePattern))
  matches.forEach((match) => {
    const matchText = match[0]
    // Skip if it's already an ID pattern
    if (matchText.startsWith('@#')) {
      return
    }

    const fieldNameFromText = match[1]
    const fieldNameLower = fieldNameFromText.toLowerCase()
    const fieldId = fieldNameToIdMap[fieldNameLower]

    if (fieldId !== undefined) {
      // Replace @fieldname with @#fieldid
      result = result.replace(new RegExp(`@${fieldNameFromText}`, 'g'), `@#${fieldId}`)
    }
  })

  return result
}
