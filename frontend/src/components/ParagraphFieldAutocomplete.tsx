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
  const previewRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

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
    
    // Check if there's a newline after @ (means we're not in a trigger)
    if (textAfterAt.includes('\n')) {
      return { isInTrigger: false, query: '', startPos: -1 }
    }

    // Check what comes after the cursor
    const textAfterCursor = text.substring(cursorPos)
    const nextChar = textAfterCursor.length > 0 ? textAfterCursor[0] : ''
    const nextTwoChars = textAfterCursor.length >= 2 ? textAfterCursor.substring(0, 2) : nextChar
    
    // Clear delimiters: newline, @, double space, or end of string
    const isCompleteFieldName = nextChar === '\n' || nextChar === '@' || nextTwoChars === '  ' || nextChar === ''
    
    // If we're right after a complete field name, check if it matches exactly
    if (isCompleteFieldName && textAfterAt.length > 0) {
      const potentialFieldName = textAfterAt.trim()
      const exactMatch = allFields.some(f => {
        const nameLower = f.name.toLowerCase()
        const potentialLower = potentialFieldName.toLowerCase()
        return nameLower === potentialLower
      })
      // If exact match and not continuing to type, don't show suggestions
      if (exactMatch && nextChar !== '@' && nextTwoChars !== '  ') {
        return { isInTrigger: false, query: '', startPos: -1 }
      }
    }

    // Extract the query (text after @, trimmed)
    const query = textAfterAt.trim().toLowerCase()
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

    // Calculate cursor position within textarea
    const textBeforeCursor = text.substring(0, cursorPos)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    
    // Get computed styles for accurate measurements
    const computedStyle = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24
    const paddingTop = parseFloat(computedStyle.paddingTop) || 8
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 12
    
    // Calculate approximate position
    // Position dropdown below the current line
    const top = (currentLine + 1) * lineHeight + paddingTop + 4
    // Position dropdown at the start of the line (where @ appears)
    const left = paddingLeft

    setSuggestionPosition({ top, left })
    // Ensure suggestions are shown
    if (allFields.length > 0) {
      setShowSuggestions(true)
    }
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
      // Show suggestions immediately, then update position
      setShowSuggestions(true)
      // Update suggestion position immediately
      requestAnimationFrame(() => {
        updateSuggestionPosition()
      })
    } else {
      // Not in trigger, hide suggestions
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  // Handle keydown for navigation and selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPos = textarea.selectionStart
    const text = value
    
    // Handle backspace to remove entire field references
    if (e.key === 'Backspace' && cursorPos > 0) {
      const textBeforeCursor = text.substring(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
      
      if (lastAtIndex !== -1) {
        // Get text after @ up to cursor
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1).trimEnd()
        
        // Check if next character after cursor is space, newline, @, or end
        const nextChar = cursorPos < text.length ? text[cursorPos] : ''
        const isAtEndOfFieldRef = nextChar === ' ' || nextChar === '\n' || nextChar === '@' || nextChar === ''
        
        if (textAfterAt.length > 0 && isAtEndOfFieldRef && !textAfterAt.includes('\n') && !textAfterAt.includes('@')) {
          // Check if this matches any known field name (case-insensitive)
          const matchingField = allFields.find(f => {
            const nameLower = f.name.toLowerCase()
            const potentialLower = textAfterAt.toLowerCase()
            return nameLower === potentialLower
          })
          
          // Only delete if it matches a known field name
          if (matchingField) {
            // Delete the entire field reference including @
            e.preventDefault()
            const before = text.substring(0, lastAtIndex)
            const after = text.substring(cursorPos)
            onChange(before + after)
            
            // Set cursor position after deletion
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(lastAtIndex, lastAtIndex)
                textareaRef.current.focus()
              }
            }, 0)
            return
          }
        }
      }
    }
    
    // Handle delete key to remove entire field references
    if (e.key === 'Delete' && cursorPos < text.length) {
      // Check if we're right before a @ symbol
      if (text[cursorPos] === '@') {
        // Find where this field reference ends
        let endIndex = cursorPos + 1
        while (endIndex < text.length) {
          const char = text[endIndex]
          if (char === ' ' || char === '\n' || char === '@') {
            break
          }
          endIndex++
        }
        
        // Delete the entire field reference
        e.preventDefault()
        const before = text.substring(0, cursorPos)
        const after = text.substring(endIndex)
        onChange(before + after)
        
        // Set cursor position after deletion
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(cursorPos, cursorPos)
            textareaRef.current.focus()
          }
        }, 0)
        return
      }
    }
    
    // Handle suggestion navigation
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

  // Sync textarea height with preview layer
  useEffect(() => {
    if (textareaRef.current && previewRef.current) {
      const textarea = textareaRef.current
      const preview = previewRef.current
      
      // Sync scroll position
      const syncScroll = () => {
        preview.scrollTop = textarea.scrollTop
        preview.scrollLeft = textarea.scrollLeft
      }
      
      textarea.addEventListener('scroll', syncScroll)
      
      return () => {
        textarea.removeEventListener('scroll', syncScroll)
      }
    }
  }, [value])

  // Parse text and create styled parts
  const parseTextWithFieldReferences = () => {
    if (!value) return []

    const parts: Array<{ text: string; isFieldRef: boolean; fieldName?: string }> = []
    let lastIndex = 0
    let i = 0

    while (i < value.length) {
      // Find next @ symbol
      const atIndex = value.indexOf('@', i)
      if (atIndex === -1) {
        // No more @ symbols, add remaining text
        if (lastIndex < value.length) {
          parts.push({ text: value.substring(lastIndex), isFieldRef: false })
        }
        break
      }

      // Add text before @
      if (atIndex > lastIndex) {
        parts.push({ text: value.substring(lastIndex, atIndex), isFieldRef: false })
      }

      // Start searching for field name after @
      let endIndex = atIndex + 1
      let potentialFieldName = ''
      let matchingField = null
      let foundExactMatch = false

      // Try to find the longest matching field name
      while (endIndex <= value.length) {
        const char = endIndex < value.length ? value[endIndex] : ''
        
        // Stop at newline or @
        if (char === '\n' || char === '@') {
          break
        }

        // Extract current potential field name (trim trailing spaces)
        potentialFieldName = value.substring(atIndex + 1, endIndex).trimEnd()
        
        if (potentialFieldName.length === 0) {
          endIndex++
          continue
        }

        // Check for exact match with known field names
        const exactMatch = allFields.find(f => {
          const nameLower = f.name.toLowerCase()
          const potentialLower = potentialFieldName.toLowerCase()
          return nameLower === potentialLower
        })

        if (exactMatch) {
          matchingField = exactMatch
          foundExactMatch = true
          // Check if next character is a space, newline, @, or end - if so, we found the complete field name
          const nextChar = endIndex < value.length ? value[endIndex] : ''
          if (nextChar === ' ' || nextChar === '\n' || nextChar === '@' || nextChar === '') {
            // Found exact match and we're at a delimiter - use this field name
            break
          }
        }

        // Stop at double space (clear delimiter)
        const nextChar = endIndex < value.length ? value[endIndex] : ''
        const nextNextChar = endIndex + 1 < value.length ? value[endIndex + 1] : ''
        if (nextChar === ' ' && nextNextChar === ' ') {
          break
        }

        endIndex++
      }

      // If we found an exact match, use that field name
      if (foundExactMatch && matchingField) {
        const fieldNameLength = matchingField.name.length
        const actualEndIndex = atIndex + 1 + fieldNameLength
        
        parts.push({
          text: value.substring(atIndex, actualEndIndex),
          isFieldRef: true,
          fieldName: matchingField.name
        })
        
        lastIndex = actualEndIndex
        i = actualEndIndex
      } else {
        // No exact match found, use what we have (might be partial or invalid)
        parts.push({
          text: value.substring(atIndex, endIndex),
          isFieldRef: true,
          fieldName: undefined // Not a complete valid field name
        })
        
        lastIndex = endIndex
        i = endIndex
      }
    }

    return parts.length > 0 ? parts : [{ text: value, isFieldRef: false }]
  }

  const textParts = parseTextWithFieldReferences()

  return (
    <Box style={{ position: 'relative', width: '100%' }}>
      {label && (
        <Text size="sm" fw={500} mb={4}>
          {label}
          {required && <Text component="span" c="red"> *</Text>}
        </Text>
      )}
      
      {/* Container with styled preview and transparent textarea */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'visible',
        }}
      >
        {/* Styled preview layer showing field references */}
        <Box
          ref={previewRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: '#fff',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '14px',
            lineHeight: '1.55',
            fontFamily: 'var(--mantine-font-family)',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'visible',
            visibility: 'visible',
            opacity: 1,
            letterSpacing: 'normal',
            textAlign: 'left',
            textIndent: 0,
            textTransform: 'none',
            verticalAlign: 'baseline',
            boxSizing: 'border-box',
          }}
        >
          {!value && placeholder && (
            <Text c="dimmed" size="sm" style={{ fontStyle: 'italic' }}>
              {placeholder}
            </Text>
          )}
          {value && (
            <Box 
              style={{ 
                position: 'relative', 
                zIndex: 1,
                margin: 0,
                padding: 0,
                display: 'block',
                width: '100%',
                minHeight: 0,
              }}
            >
              {textParts.map((part, index) => {
                if (part.isFieldRef && part.fieldName) {
                  return (
                    <span
                      key={index}
                      className="field-reference-badge"
                      style={{
                        color: '#6366f1',
                        fontWeight: 'normal',
                        fontSize: 'inherit',
                        margin: 0,
                        padding: 0,
                        verticalAlign: 'baseline',
                        lineHeight: 'inherit',
                        position: 'relative',
                        zIndex: 10,
                        display: 'inline',
                        fontFamily: 'inherit',
                        letterSpacing: 'inherit',
                        textShadow: '0 0 0 #6366f1',
                        WebkitTextFillColor: '#6366f1',
                      }}
                    >
                      @{part.fieldName}
                    </span>
                  )
                } else if (part.isFieldRef && !part.fieldName) {
                  // Invalid field reference - distinct styling
                  return (
                    <span
                      key={index}
                      className="field-reference"
                      style={{
                        color: '#868e96',
                        fontWeight: 'inherit',
                        fontSize: 'inherit',
                        margin: 0,
                        padding: 0,
                        display: 'inline',
                        verticalAlign: 'baseline',
                        lineHeight: 'inherit',
                        fontFamily: 'inherit',
                        letterSpacing: 'inherit',
                      }}
                    >
                      {part.text}
                    </span>
                  )
                } else {
                  return (
                    <span 
                      key={index} 
                      style={{ 
                        color: '#212529',
                        margin: 0,
                        padding: 0,
                        display: 'inline',
                        verticalAlign: 'baseline',
                        lineHeight: 'inherit',
                        fontFamily: 'inherit',
                        letterSpacing: 'inherit',
                      }}
                    >
                      {part.text}
                    </span>
                  )
                }
              })}
            </Box>
          )}
        </Box>
        
        {/* Transparent textarea for input - positioned on top */}
        <Textarea
          ref={textareaRef}
          placeholder=""
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={updateSuggestionPosition}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          rows={rows}
          size={size}
          required={required}
          styles={{
            wrapper: {
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'transparent',
              margin: 0,
              padding: 0,
              border: 'none',
              display: 'block',
            },
            root: {
              backgroundColor: 'transparent',
              margin: 0,
              padding: 0,
              border: 'none',
              display: 'block',
            },
            input: {
              backgroundColor: 'transparent',
              color: 'transparent',
              caretColor: '#212529',
              border: '1px solid transparent',
              padding: '8px 12px',
              margin: 0,
              resize: 'none',
              boxShadow: 'none',
              outline: 'none',
              fontSize: '14px',
              lineHeight: '1.55',
              fontFamily: 'var(--mantine-font-family)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: 'auto',
              height: 'auto',
              borderRadius: '4px',
              letterSpacing: 'normal',
              textAlign: 'left',
              textIndent: 0,
              textTransform: 'none',
              verticalAlign: 'top',
              boxSizing: 'border-box',
              width: '100%',
              display: 'block',
            }
          }}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </Box>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          shadow="md"
          p={4}
          style={{
            position: 'absolute',
            top: `${suggestionPosition.top}px`,
            left: `${suggestionPosition.left}px`,
            zIndex: 10000,
            maxHeight: '180px',
            overflowY: 'auto',
            width: 'auto',
            backgroundColor: 'white',
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur
        >
          <Stack gap={1}>
            {filteredSuggestions.map((field, index) => (
              <Paper
                key={field.id}
                p={4}
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
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="xs" fw={500}>
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
                  <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
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

