import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Stack,
  Progress,
  Group,
  Loader,
  Alert,
  useMantineTheme,
} from '@mantine/core'
import { IconFileText, IconX, IconArrowRight, IconAlertCircle, IconCheck, IconArrowLeft } from '@tabler/icons-react'
import { formAPI, FormRenderResponse, SubmitAnswerRequest, Field } from '../services/api'
import FieldRenderer from '../components/FieldRenderer'
import { evaluateFieldConditions } from '../utils/conditionEvaluator'
import { replaceFieldReferences } from '../utils/fieldReferenceReplacer'

function FormView() {
  const theme = useMantineTheme()
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormRenderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [sessionId, setSessionId] = useState<string>('')
  const [submissionId, setSubmissionId] = useState<number | null>(null)
  const currentPageIdRef = useRef<number | null>(null)
  
  // Local field visibility state for same-page conditions
  const [localFieldVisibility, setLocalFieldVisibility] = useState<Record<number, boolean>>({})
  const [localFieldRequired, setLocalFieldRequired] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (formId) {
      initializeForm(parseInt(formId))
    }
  }, [formId])

  // Real-time condition evaluation: evaluate same-page conditions locally
  useEffect(() => {
    // Don't evaluate conditions if form is not loaded or we're submitting
    if (!formData || submitting || loading) return

    const currentPage = formData.current_page
    
    // Evaluate same-page conditions locally (no API call needed)
    const updatedVisibility: Record<number, boolean> = {}
    const updatedRequired: Record<number, boolean> = {}
    
    for (const field of currentPage.fields) {
      // Check if field has same-page conditions
      if (field.conditions && field.conditions.length > 0) {
        // Evaluate conditions locally
        const conditionResult = evaluateFieldConditions(field.conditions, answers)
        
        // Apply visibility
        const hasVisibilityConditions = field.conditions.some(c => c.action === 'show' || c.action === 'hide')
        if (hasVisibilityConditions) {
          updatedVisibility[field.id] = conditionResult.show && !conditionResult.hide
        } else {
          // Use backend value if no visibility conditions
          updatedVisibility[field.id] = field.is_visible
        }
        
        // Apply required
        const hasRequireConditions = field.conditions.some(c => c.action === 'require')
        if (hasRequireConditions) {
          updatedRequired[field.id] = conditionResult.require
        } else {
          updatedRequired[field.id] = field.is_required
        }
      } else {
        // No conditions, use backend values
        updatedVisibility[field.id] = field.is_visible
        updatedRequired[field.id] = field.is_required
      }
    }
    
    // Update local visibility state
    setLocalFieldVisibility(updatedVisibility)
    setLocalFieldRequired(updatedRequired)
  }, [answers, formData?.current_page.id, submitting, loading])

  const initializeForm = async (id: number) => {
    try {
      setLoading(true)
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      const submission = await formAPI.createSubmission(id, newSessionId)
      setSubmissionId(submission.id)
      const data = await formAPI.renderForm(id, newSessionId, {})
      setFormData(data)
      currentPageIdRef.current = data.current_page.id

      // Initialize answers for all fields on the current page
      // Include all fields (even empty ones) so condition evaluation works correctly for same-page fields
      const initialAnswers: Record<string, any> = {}
      const initialVisibility: Record<number, boolean> = {}
      const initialRequired: Record<number, boolean> = {}
      
      data.current_page.fields.forEach((field) => {
        if (field.current_value !== undefined && field.current_value !== null) {
          initialAnswers[field.name] = field.current_value
        } else {
          // Initialize empty fields as empty string so IS_EMPTY conditions can evaluate
          initialAnswers[field.name] = ""
        }
        
        // Initialize visibility and required from backend (conditions already evaluated)
        initialVisibility[field.id] = field.is_visible
        initialRequired[field.id] = field.is_required
      })
      
      setAnswers(initialAnswers)
      setLocalFieldVisibility(initialVisibility)
      setLocalFieldRequired(initialRequired)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load form')
      console.error('Error initializing form:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    // Normalize empty values: null, undefined, or empty string should be sent as empty string
    // This ensures the backend can properly evaluate "is_empty" conditions for same-page fields
    const normalizedValue = (value === null || value === undefined || value === '') ? '' : value
    setAnswers((prev) => ({
      ...prev,
      [fieldName]: normalizedValue,
    }))
  }

  const handlePreviousPage = async () => {
    if (!submissionId || !formData) return

    try {
      setLoading(true)
      setError(null)

      const updatedForm = await formAPI.getPreviousPageForSubmission(submissionId)
      setFormData(updatedForm)
      currentPageIdRef.current = updatedForm.current_page.id

      // Initialize answers for the previous page
      const newAnswers: Record<string, any> = {}
      const newVisibility: Record<number, boolean> = {}
      const newRequired: Record<number, boolean> = {}
      
      updatedForm.current_page.fields.forEach((field) => {
        if (field.current_value !== undefined && field.current_value !== null && field.current_value !== '') {
          newAnswers[field.name] = field.current_value
        } else {
          newAnswers[field.name] = ""
        }
        
        newVisibility[field.id] = field.is_visible
        newRequired[field.id] = field.is_required
      })
      
      setAnswers(newAnswers)
      setLocalFieldVisibility(newVisibility)
      setLocalFieldRequired(newRequired)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load previous page')
      console.error('Error loading previous page:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !sessionId) return

    try {
      setSubmitting(true)
      setError(null)

      // Get visible fields with local required state
      const visibleFields = formData.current_page.fields
        .filter((f) => {
          const isVisible = localFieldVisibility[f.id] !== undefined 
            ? localFieldVisibility[f.id] 
            : f.is_visible
          return isVisible
        })

      // Validate required fields
      const missingRequiredFields: string[] = []
      for (const field of visibleFields) {
        const isRequired = localFieldRequired[field.id] !== undefined 
          ? localFieldRequired[field.id] 
          : field.is_required
        
        if (isRequired) {
          const value = answers[field.name]
          // Check if value is empty (null, undefined, empty string, or empty array)
          const isEmpty = value === undefined || 
                         value === null || 
                         value === '' || 
                         (Array.isArray(value) && value.length === 0)
          
          if (isEmpty) {
            missingRequiredFields.push(field.label || field.name)
          }
        }
      }

      if (missingRequiredFields.length > 0) {
        setError(`Please fill in all required fields: ${missingRequiredFields.join(', ')}`)
        setSubmitting(false)
        return
      }

      // Submit answers for all visible fields
      for (const field of visibleFields) {
        const value = answers[field.name]
        if (value !== undefined && value !== null && value !== '') {
          const submitData: SubmitAnswerRequest = {
            session_id: sessionId,
            field_id: field.id,
            value: value,
          }
          await formAPI.submitAnswer(submitData)
        }
      }

      // After submitting, render form again to get the next page
      // Don't pass answers - let it get from database to ensure we have the latest state
      const updatedForm = await formAPI.renderForm(parseInt(formId!), sessionId)

      if (updatedForm.is_complete) {
        await formAPI.completeSubmission(sessionId)
        // Navigate to home page to view all forms
        navigate('/')
      } else {
        // Backend should have advanced to next page if answers exist
        // Always update formData with the response
        setFormData(updatedForm)
        currentPageIdRef.current = updatedForm.current_page.id
        
        
        // Initialize answers for the new page
        // Include all fields (even empty ones) so condition evaluation works correctly
        const newAnswers: Record<string, any> = {}
        const newVisibility: Record<number, boolean> = {}
        const newRequired: Record<number, boolean> = {}
        
        updatedForm.current_page.fields.forEach((field) => {
          if (field.current_value !== undefined && field.current_value !== null) {
            newAnswers[field.name] = field.current_value
          } else {
            // Initialize empty fields as empty string so IS_EMPTY conditions can evaluate
            newAnswers[field.name] = ""
          }
          
          // Initialize visibility and required from backend (conditions already evaluated)
          newVisibility[field.id] = field.is_visible
          newRequired[field.id] = field.is_required
        })
        
        setAnswers(newAnswers)
        setLocalFieldVisibility(newVisibility)
        setLocalFieldRequired(newRequired)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit answer')
      console.error('Error submitting answer:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading form...</Text>
        </Stack>
      </Container>
    )
  }

  if (error && !formData) {
    return (
      <Container size="sm" py="xl">
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Stack gap="md">
            <Alert icon={<IconAlertCircle size={20} />} title="Error" color="red">
              {error}
            </Alert>
            <Button fullWidth onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </Stack>
        </Card>
      </Container>
    )
  }

  if (!formData) return null

  return (
    <Container size="md" py="xl">
      {/* Progress Bar */}
      <Card shadow="md" p="lg" radius="lg" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="sm" fw={600} mb={4} style={{ letterSpacing: '0.02em' }}>Form Progress</Text>
            <Text size="xs" c="dimmed">Complete the form to submit</Text>
          </div>
          <div style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            boxShadow: 'var(--shadow-colored)',
          }}>
            <Text size="xl" fw={700}>{Math.round(formData.progress)}%</Text>
          </div>
        </Group>
        <Progress value={formData.progress} size="xl" radius="xl" color="indigo" />
      </Card>

      {/* Form Card */}
      <Card key={`page-${formData.current_page.id}`} shadow="lg" padding="xl" radius="lg" withBorder>
        <Stack gap="xl">
          <div style={{
            paddingBottom: '1.5rem',
            borderBottom: `2px solid ${theme.colors.slate[2]}`,
          }}>
            <Group gap="md" align="flex-start" mb="md">
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-colored)',
              }}>
                <IconFileText size={32} stroke={2.5} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <Title order={1} mb="xs" style={{ 
                  letterSpacing: '-0.02em',
                  fontWeight: 700,
                }}>
                  {formData.form_title}
                </Title>
                {formData.current_page.description && (
                  <Text c="dimmed" size="sm" style={{ 
                    lineHeight: 1.6,
                    color: theme.colors.slate[5],
                  }}>
                    {formData.current_page.description}
                  </Text>
                )}
              </div>
            </Group>
            <div style={{ paddingLeft: '80px' }}>
              <Title order={3} style={{ 
                letterSpacing: '-0.01em',
                fontWeight: 600,
                color: theme.colors.slate[6],
              }}>
                {formData.current_page.title}
              </Title>
            </div>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={20} />} title="Error" color="red">
              {error}
            </Alert>
          )}

          <form key={formData.current_page.id} onSubmit={handleSubmit}>
            <Stack gap="lg">
              {formData.current_page.fields
                .filter((field) => {
                  // Use local visibility if available (for same-page conditions), otherwise use backend value
                  const isVisible = localFieldVisibility[field.id] !== undefined 
                    ? localFieldVisibility[field.id] 
                    : field.is_visible
                  return isVisible
                })
                .map((field) => {
                  // Create field with updated visibility and required from local state
                  let fieldWithLocalState: Field = {
                    ...field,
                    is_visible: localFieldVisibility[field.id] !== undefined 
                      ? localFieldVisibility[field.id] 
                      : field.is_visible,
                    is_required: localFieldRequired[field.id] !== undefined 
                      ? localFieldRequired[field.id] 
                      : field.is_required
                  }
                  
                  // Process paragraph fields: replace @fieldname references with actual values reactively
                  if (field.field_type === 'paragraph' && field.default_value) {
                    // Get all fields from current page and all previous pages (from answers)
                    const allFields = formData.current_page.fields
                    const processedContent = replaceFieldReferences(
                      field.default_value,
                      answers,
                      allFields
                    )
                    fieldWithLocalState = {
                      ...fieldWithLocalState,
                      default_value: processedContent
                    }
                  }
                  
                  return (
                  <FieldRenderer
                      key={`${field.id}-${fieldWithLocalState.is_visible}`}
                      field={fieldWithLocalState}
                    value={answers[field.name]}
                    onChange={(value) => handleFieldChange(field.name, value)}
                  />
                  )
                })}
            </Stack>

            <Group justify="space-between" mt="xl" pt="lg" style={{ 
              borderTop: `2px solid ${theme.colors.slate[2]}`,
              backgroundColor: theme.colors.slate[0],
              margin: '1.5rem -1.5rem -1.5rem -1.5rem',
              padding: '1.5rem',
              borderRadius: '0 0 16px 16px',
            }}>
              <Group gap="sm">
                <Button
                  variant="default"
                  leftSection={<IconX size={18} />}
                  onClick={() => navigate('/')}
                  size="md"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </Button>
                {submissionId && !formData.current_page.is_first && (
                  <Button
                    variant="default"
                    leftSection={<IconArrowLeft size={18} />}
                    onClick={handlePreviousPage}
                    disabled={loading}
                    size="md"
                    style={{ fontWeight: 600 }}
                  >
                    Back
                  </Button>
                )}
              </Group>
              <Button
                type="submit"
                loading={submitting}
                rightSection={!submitting && (formData.is_complete || !formData.next_page_id) ? <IconCheck size={18} /> : <IconArrowRight size={18} />}
                color="indigo"
                size="md"
                style={{ 
                  padding: '0.75rem 1.5rem',
                  fontWeight: 600,
                }}
              >
                {submitting 
                  ? 'Submitting...' 
                  : formData.is_complete
                    ? 'Submit' 
                    : formData.next_page_id
                      ? 'Next'
                      : 'Submit'}
              </Button>
            </Group>
          </form>
        </Stack>
      </Card>
    </Container>
  )
}

export default FormView
