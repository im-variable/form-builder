import { createTheme, MantineColorsTuple } from '@mantine/core'

// Modern cohesive color palette - Indigo/Violet theme
const indigo: MantineColorsTuple = [
  '#eef2ff', // 0 - lightest
  '#e0e7ff', // 1
  '#c7d2fe', // 2
  '#a5b4fc', // 3
  '#818cf8', // 4 - primary shade
  '#6366f1', // 5 - main indigo
  '#4f46e5', // 6
  '#4338ca', // 7
  '#3730a3', // 8
  '#312e81', // 9 - darkest
]

const violet: MantineColorsTuple = [
  '#f5f3ff', // 0 - lightest
  '#ede9fe', // 1
  '#ddd6fe', // 2
  '#c4b5fd', // 3
  '#a78bfa', // 4
  '#8b5cf6', // 5 - main violet
  '#7c3aed', // 6
  '#6d28d9', // 7
  '#5b21b6', // 8
  '#4c1d95', // 9 - darkest
]

const cyan: MantineColorsTuple = [
  '#ecfeff', // 0 - lightest
  '#cffafe', // 1
  '#a5f3fc', // 2
  '#67e8f9', // 3
  '#22d3ee', // 4
  '#06b6d4', // 5 - main cyan
  '#0891b2', // 6
  '#0e7490', // 7
  '#155e75', // 8
  '#164e63', // 9 - darkest
]

const emerald: MantineColorsTuple = [
  '#ecfdf5', // 0 - lightest
  '#d1fae5', // 1
  '#a7f3d0', // 2
  '#6ee7b7', // 3
  '#34d399', // 4
  '#10b981', // 5 - main emerald
  '#059669', // 6
  '#047857', // 7
  '#065f46', // 8
  '#064e3b', // 9 - darkest
]

const slate: MantineColorsTuple = [
  '#f8fafc', // 0 - lightest
  '#f1f5f9', // 1
  '#e2e8f0', // 2
  '#cbd5e1', // 3
  '#94a3b8', // 4
  '#64748b', // 5
  '#475569', // 6
  '#334155', // 7
  '#1e293b', // 8
  '#0f172a', // 9 - darkest
]

export const theme = createTheme({
  primaryColor: 'indigo',
  primaryShade: 5,
  defaultColorScheme: 'light',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
  },
  
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '3rem', fontWeight: '700', lineHeight: '1.1', color: '#1e293b' },
      h2: { fontSize: '2rem', fontWeight: '600', lineHeight: '1.2', color: '#334155' },
      h3: { fontSize: '1.5rem', fontWeight: '600', lineHeight: '1.3', color: '#334155' },
      h4: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.4', color: '#475569' },
      h5: { fontSize: '1.125rem', fontWeight: '600', lineHeight: '1.5', color: '#475569' },
      h6: { fontSize: '1rem', fontWeight: '600', lineHeight: '1.5', color: '#475569' },
    },
  },
  
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  },
  
  radius: {
    xs: '0.375rem',  // 6px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
  },
  
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  
  defaultRadius: 'md',
  
  colors: {
    indigo,
    violet,
    cyan,
    emerald,
    slate,
  },
  
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: (theme, params) => {
        const isFilled = params.variant === 'filled'
        const isLight = params.variant === 'light'
        const isDefault = params.variant === 'default'
        const isSubtle = params.variant === 'subtle'
        const color = params.color || 'indigo'
        
        // Get color values based on the color prop
        const colorValue = theme.colors[color]?.[5] || theme.colors.indigo[5]
        const colorHover = theme.colors[color]?.[6] || theme.colors.indigo[6]
        const colorLight = theme.colors[color]?.[0] || theme.colors.indigo[0]
        
        return {
          root: {
            fontWeight: 600,
            borderRadius: theme.radius.md,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.01em',
            ...(isFilled && {
              backgroundColor: colorValue,
              color: 'white',
              boxShadow: `0 4px 14px 0 ${theme.fn.rgba(colorValue, 0.4)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${theme.fn.rgba(colorValue, 0.5)}`,
                backgroundColor: colorHover,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }),
            ...(isLight && {
              backgroundColor: colorLight,
              color: colorValue,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows.xs,
                backgroundColor: theme.colors[color]?.[1] || theme.colors.indigo[1],
              },
            }),
            ...(isDefault && {
              borderColor: theme.colors.slate[3],
              color: theme.colors.slate[8],
              '&:hover': {
                backgroundColor: theme.colors.slate[1],
                borderColor: theme.colors.slate[4],
              },
            }),
            ...(isSubtle && {
              color: theme.colors.slate[7],
              '&:hover': {
                backgroundColor: theme.colors.slate[1],
              },
            }),
          },
        }
      },
    },
    
    Card: {
      defaultProps: {
        shadow: 'sm',
        padding: 'lg',
        radius: 'lg',
        withBorder: true,
      },
      styles: (theme) => ({
        root: {
          backgroundColor: 'white',
          border: `1px solid ${theme.colors.slate[2]}`,
          boxShadow: theme.shadows.sm,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows.md,
            borderColor: theme.colors.slate[3],
          },
        },
      }),
    },
    
    TextInput: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'white',
          borderColor: theme.colors.slate[3],
          borderWidth: '1.5px',
          fontSize: theme.fontSizes.md,
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
          borderRadius: theme.radius.md,
          color: theme.colors.slate[9],
          '&:focus': {
            borderColor: theme.colors.indigo[5],
            borderWidth: '2px',
            backgroundColor: 'white',
            boxShadow: `0 0 0 4px ${theme.colors.indigo[0]}`,
          },
          '&:hover': {
            borderColor: theme.colors.slate[4],
          },
          '&::placeholder': {
            color: theme.colors.slate[5],
          },
        },
        label: {
          fontWeight: 600,
          marginBottom: '0.5rem',
          fontSize: theme.fontSizes.sm,
          color: theme.colors.slate[8],
          letterSpacing: '0.01em',
        },
      }),
    },
    
    Textarea: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'white',
          borderColor: theme.colors.slate[3],
          borderWidth: '1.5px',
          fontSize: theme.fontSizes.md,
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
          borderRadius: theme.radius.md,
          color: theme.colors.slate[9],
          '&:focus': {
            borderColor: theme.colors.indigo[5],
            borderWidth: '2px',
            backgroundColor: 'white',
            boxShadow: `0 0 0 4px ${theme.colors.indigo[0]}`,
          },
          '&:hover': {
            borderColor: theme.colors.slate[4],
          },
          '&::placeholder': {
            color: theme.colors.slate[5],
          },
        },
        label: {
          fontWeight: 600,
          marginBottom: '0.5rem',
          fontSize: theme.fontSizes.sm,
          color: theme.colors.slate[8],
          letterSpacing: '0.01em',
        },
      }),
    },
    
    Select: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'white',
          borderColor: theme.colors.slate[3],
          borderWidth: '1.5px',
          fontSize: theme.fontSizes.md,
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
          borderRadius: theme.radius.md,
          color: theme.colors.slate[9],
          '&:focus': {
            borderColor: theme.colors.indigo[5],
            borderWidth: '2px',
            backgroundColor: 'white',
            boxShadow: `0 0 0 4px ${theme.colors.indigo[0]}`,
          },
          '&:hover': {
            borderColor: theme.colors.slate[4],
          },
          '&::placeholder': {
            color: theme.colors.slate[5],
          },
        },
        label: {
          fontWeight: 600,
          marginBottom: '0.5rem',
          fontSize: theme.fontSizes.sm,
          color: theme.colors.slate[8],
          letterSpacing: '0.01em',
        },
      }),
    },
    
    NumberInput: {
      styles: (theme) => ({
        input: {
          backgroundColor: 'white',
          borderColor: theme.colors.slate[3],
          borderWidth: '1.5px',
          fontSize: theme.fontSizes.md,
          padding: '0.75rem 1rem',
          transition: 'all 0.2s ease',
          borderRadius: theme.radius.md,
          color: theme.colors.slate[9],
          '&:focus': {
            borderColor: theme.colors.indigo[5],
            borderWidth: '2px',
            backgroundColor: 'white',
            boxShadow: `0 0 0 4px ${theme.colors.indigo[0]}`,
          },
          '&:hover': {
            borderColor: theme.colors.slate[4],
          },
        },
        label: {
          fontWeight: 600,
          marginBottom: '0.5rem',
          fontSize: theme.fontSizes.sm,
          color: theme.colors.slate[8],
          letterSpacing: '0.01em',
        },
      }),
    },
    
    Paper: {
      styles: (theme) => ({
        root: {
          backgroundColor: 'white',
          borderColor: theme.colors.slate[2],
          boxShadow: theme.shadows.xs,
        },
      }),
    },
    
    Progress: {
      styles: (theme) => ({
        root: {
          backgroundColor: theme.colors.slate[1],
          borderRadius: theme.radius.xl,
          height: '12px',
        },
        bar: {
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.indigo[5],
          boxShadow: `0 2px 8px ${theme.fn.rgba(theme.colors.indigo[5], 0.4)}`,
        },
      }),
    },
    
    Badge: {
      styles: (theme) => ({
        root: {
          fontWeight: 600,
          letterSpacing: '0.02em',
          borderRadius: theme.radius.md,
        },
      }),
    },
    
    Alert: {
      styles: (theme) => ({
        root: {
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.slate[2]}`,
        },
      }),
    },
    
    Checkbox: {
      styles: (theme) => ({
        input: {
          cursor: 'pointer',
          '&:checked': {
            backgroundColor: theme.colors.indigo[5],
            borderColor: theme.colors.indigo[5],
          },
        },
        label: {
          cursor: 'pointer',
          color: theme.colors.slate[8],
        },
      }),
    },
    
    Radio: {
      styles: (theme) => ({
        radio: {
          cursor: 'pointer',
          '&:checked': {
            backgroundColor: theme.colors.indigo[5],
            borderColor: theme.colors.indigo[5],
          },
        },
        label: {
          cursor: 'pointer',
          color: theme.colors.slate[8],
        },
      }),
    },
    
    Switch: {
      styles: (theme) => ({
        track: {
          cursor: 'pointer',
          '&:checked': {
            backgroundColor: theme.colors.indigo[5],
          },
        },
        label: {
          cursor: 'pointer',
          color: theme.colors.slate[8],
        },
      }),
    },
  },
})
