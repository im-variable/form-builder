import { useState, useEffect } from 'react'
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
  Paper,
} from '@mantine/core'
import { IconFileText, IconX, IconArrowRight, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { formAPI, FormRenderResponse, SubmitAnswerRequest } from '../services/api'
import FieldRenderer from '../components/FieldRenderer'

function FormView() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormRenderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    if (formId) {
      initializeForm(parseInt(formId))
    }
  }, [formId])

  const initializeForm = async (id: number) => {
    try {
      setLoading(true)
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      await formAPI.createSubmission(id, newSessionId)
      const data = await formAPI.renderForm(id, newSessionId, {})
      setFormData(data)

      const initialAnswers: Record<string, any> = {}
      data.current_page.fields.forEach((field) => {
        if (field.current_value !== undefined && field.current_value !== null) {
          initialAnswers[field.name] = field.current_value
        }
      })
      setAnswers(initialAnswers)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load form')
      console.error('Error initializing form:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !sessionId) return

    try {
      setSubmitting(true)
      setError(null)

      const visibleFields = formData.current_page.fields.filter((f) => f.is_visible)

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
      } else if (updatedForm.next_page_id) {
        setFormData(updatedForm)
        setAnswers({})
      } else {
        setFormData(updatedForm)
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
      <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Progress</Text>
          <Text size="lg" fw={700} c="indigo">{Math.round(formData.progress)}%</Text>
        </Group>
        <Progress value={formData.progress} size="lg" radius="xl" />
      </Paper>

      {/* Form Card */}
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Stack gap="xl">
          <Group gap="md" align="flex-start">
            <IconFileText size={32} stroke={1.5} style={{ color: 'var(--mantine-color-indigo-6)' }} />
            <div style={{ flex: 1 }}>
              <Title order={1} mb="xs">{formData.form_title}</Title>
              {formData.current_page.description && (
                <Text c="dimmed">{formData.current_page.description}</Text>
              )}
            </div>
          </Group>

          <div>
            <Title order={2} mb="md">{formData.current_page.title}</Title>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={20} />} title="Error" color="red">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {formData.current_page.fields
                .filter((field) => field.is_visible)
                .map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={answers[field.name]}
                    onChange={(value) => handleFieldChange(field.name, value)}
                  />
                ))}
            </Stack>

            <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <Button
                variant="default"
                leftSection={<IconX size={18} />}
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                rightSection={!submitting && (formData.is_complete || !formData.next_page_id) ? <IconCheck size={18} /> : <IconArrowRight size={18} />}
                variant="gradient"
                gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
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
