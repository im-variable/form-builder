/**
 * DateTime utility functions for converting between UTC and local timezone
 */

/**
 * Convert a local datetime string (from datetime-local input) to UTC ISO string
 * @param localDateTimeString - String from datetime-local input (e.g., "2025-12-18T21:30")
 * @returns UTC ISO string (e.g., "2025-12-18T16:00:00.000Z")
 */
export function convertLocalToUTC(localDateTimeString: string): string {
  if (!localDateTimeString) return ''
  
  // Create a date object from the local datetime string
  // This treats the input as local time
  const localDate = new Date(localDateTimeString)
  
  // Return ISO string which is in UTC
  return localDate.toISOString()
}

/**
 * Convert a UTC ISO string to local datetime string for datetime-local input
 * @param utcISOString - UTC ISO string (e.g., "2025-12-18T16:00:00.000Z")
 * @returns Local datetime string for datetime-local input (e.g., "2025-12-18T21:30")
 */
export function convertUTCToLocal(utcISOString: string): string {
  if (!utcISOString) return ''
  
  // Parse UTC datetime
  const utcDate = new Date(utcISOString)
  
  // Get local date components
  const year = utcDate.getFullYear()
  const month = String(utcDate.getMonth() + 1).padStart(2, '0')
  const day = String(utcDate.getDate()).padStart(2, '0')
  const hours = String(utcDate.getHours()).padStart(2, '0')
  const minutes = String(utcDate.getMinutes()).padStart(2, '0')
  
  // Return format: YYYY-MM-DDTHH:mm (for datetime-local input)
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Format UTC datetime string for display in local timezone
 * @param utcISOString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted string in local timezone
 */
export function formatUTCDateTime(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return ''
  
  const date = new Date(utcISOString)
  
  // Default options for date and time
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }
  
  return date.toLocaleString(undefined, defaultOptions)
}

/**
 * Format UTC datetime string for display (date only)
 * @param utcISOString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in local timezone
 */
export function formatUTCDate(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return ''
  
  const date = new Date(utcISOString)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }
  
  return date.toLocaleDateString(undefined, defaultOptions)
}

/**
 * Format UTC datetime string for display (time only)
 * @param utcISOString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string in local timezone
 */
export function formatUTCTime(
  utcISOString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!utcISOString) return ''
  
  const date = new Date(utcISOString)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }
  
  return date.toLocaleTimeString(undefined, defaultOptions)
}

