import { useState, useRef, useEffect, useMemo } from 'react'
import { Textarea, Paper, Stack, Text, Group, Badge, Box } from '@mantine/core'
import { Field, Page } from '../services/api'

interface ParagraphFieldAutocompleteProps {
  value: string
  onChange: (value: string) => void
  pages: Page[]
  allFields: Array<Field & { pageTitle?: string }>
  placeholder?: string
  label?: string
  required?: boolean
  rows?: number
  size?: string
}

export function ParagraphFieldAutocomplete({
  value,
  onChange,
  pages,
  allFields,
  placeholder,
  label,
  required,
  rows = 6,
  size = 'sm',
}: ParagraphFieldAutocompleteProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Create a map of page IDs to page titles
  const pageTitleMap = useMemo(() => {
    const map: Record<number, string> = {}
    pages.forEach((page) => {
      map[page.id] = page.title
    })
    return map
  }, [pages])

  // Filter suggestions based on search query
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) {
      return allFields
    }

    const query = searchQuery.toLowerCase()
    return allFields.filter((field) => {
      const fieldName = field.name.toLowerCase()
      const fieldLabel = field.label.toLowerCase()
      return fieldName.includes(query) || fieldLabel.includes(query)
    })
  }, [allFields, searchQuery])

  // Get cursor position and check if we're in a @ trigger
  const getCursorInfo = (text: string, cursorPos: number) => {
    // Find the last @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      return { isInTrigger: false, query: '', startPos: -1 }
    }

    // Get text after @
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
    
    // Check if there's a space or newline after @ (means we're not in a trigger)
    if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
      return { isInTrigger: false, query: '', startPos: -1 }
    }

    // Check if we're right after a complete field name (check if next char is space, newline, or end of string)
    const textAfterCursor = text.substring(cursorPos)
    const nextChar = textAfterCursor.length > 0 ? textAfterCursor[0] : ''
    const isCompleteFieldName = nextChar === ' ' || nextChar === '\n' || nextChar === '' || nextChar === '@'
    
    // If we're right after a complete field name and not typing, don't show suggestions
    if (isCompleteFieldName && textAfterAt.length > 0) {
      // Check if this matches any field name exactly
      const potentialFieldName = textAfterAt
      const matchesField = allFields.some(f => f.name.toLowerCase() === potentialFieldName.toLowerCase())
      if (matchesField && nextChar !== '@') {
        return { isInTrigger: false, query: '', startPos: -1 }
      }
    }

    // Extract the query (text after @)
    const query = textAfterAt.toLowerCase()
    return { isInTrigger: true, query, startPos: lastAtIndex }
  }

  // Calculate suggestion dropdown position
  const updateSuggestionPosition = () => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const text = value
    const cursorPos = textarea.selectionStart

    const { isInTrigger, startPos } = getCursorInfo(text, cursorPos)

    if (!isInTrigger || startPos === -1) {
      setShowSuggestions(false)
      setSearchQuery('')
      return
    }

    // Calculate position based on cursor
    const textBeforeCursor = text.substring(0, cursorPos)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    const currentLineText = lines[currentLine]
    const column = currentLineText.length

    // Approximate position (this is a simplified calculation)
    const lineHeight = 20 // Approximate line height
    const charWidth = 8 // Approximate character width
    const padding = 10

    const top = (currentLine + 1) * lineHeight + padding
    const left = column * charWidth + padding

    setSuggestionPosition({ top, left })
    setShowSuggestions(true)
  }

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Update search query and check if we should show suggestions
    const cursorPos = e.target.selectionStart
    const { isInTrigger, query } = getCursorInfo(newValue, cursorPos)
    
    if (isInTrigger) {
      setSearchQuery(query)
      setSelectedIndex(0)
      // Update suggestion position after a short delay to allow DOM update
      setTimeout(() => {
        updateSuggestionPosition()
      }, 0)
    } else {
      // Not in trigger, hide suggestions
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  // Handle keydown for navigation and selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertSuggestion(filteredSuggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Insert selected suggestion
  const insertSuggestion = (field: Field & { pageTitle?: string }) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const text = value
    const cursorPos = textarea.selectionStart

    const { startPos } = getCursorInfo(text, cursorPos)
    if (startPos === -1) return

    // Replace @query with @fieldname
    const before = text.substring(0, startPos)
    const after = text.substring(cursorPos)
    const newText = `${before}@${field.name} ${after}` // Add space after field name

    // Hide suggestions immediately
    setShowSuggestions(false)
    setSearchQuery('')
    onChange(newText)

    // Set cursor position after inserted field name and space
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = startPos + field.name.length + 2 // +1 for @, +1 for space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Update position when value changes
  useEffect(() => {
    if (textareaRef.current && showSuggestions) {
      updateSuggestionPosition()
    }
  }, [value, showSuggestions])

  return (
    <Box style={{ position: 'relative' }}>
      <Textarea
        ref={textareaRef}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={updateSuggestionPosition}
        onBlur={() => {
          // Delay hiding to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200)
        }}
        rows={rows}
        size={size}
        required={required}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          shadow="md"
          p="xs"
          style={{
            position: 'absolute',
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '300px',
            maxWidth: '400px',
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
          <Stack gap={2}>
            {filteredSuggestions.map((field, index) => (
              <Paper
                key={field.id}
                p="xs"
                style={{
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? 'var(--mantine-color-blue-0)' : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertSuggestion(field)
                }}
              >
                <Group justify="space-between" gap="xs">
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        @{field.name}
                      </Text>
                      <Badge size="xs" variant="light" color="blue">
                        {field.field_type}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {field.label}
                    </Text>
                  </Stack>
                  <Badge size="xs" variant="outline" color="gray">
                    {field.pageTitle}
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

