import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Loader,
  Alert,
  Badge,
  Paper,
  Divider,
  Grid,
  ScrollArea,
  Tooltip,
  ActionIcon,
  Box,
  Modal,
  Pagination,
  Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconArrowLeft, IconAlertCircle, IconFileText, IconCalendar, IconCheck, IconUser, IconClock, IconTrash } from '@tabler/icons-react'
import { formAPI, builderAPI } from '../services/api'

interface Submission {
  id: number
  session_id: string
  status: string
  created_at: string
  completed_at: string
  responses: Record<string, {
    field_id: number
    label: string
    value: string
    field_type: string
  }>
}

function FormResponses() {
  const { formId } = useParams<{ formId: string }>()
  const [form, setForm] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activePage, setActivePage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (formId) {
      setActivePage(1) // Reset to first page when form changes
      loadData()
    }
  }, [formId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [formData, submissionsData] = await Promise.all([
        builderAPI.getForm(parseInt(formId!)),
        formAPI.getFormSubmissions(parseInt(formId!))
      ])
      
      setForm(formData)
      setSubmissions(submissionsData.submissions || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load responses')
      console.error('Error loading responses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (submission: Submission) => {
    setSubmissionToDelete(submission)
    openDeleteModal()
  }

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return

    try {
      setDeleting(true)
      setError(null)
      await formAPI.deleteSubmission(submissionToDelete.id)
      // Reload submissions after deletion
      await loadData()
      
      // Reset pagination if current page becomes empty
      const remainingCount = submissions.length - 1
      const maxPage = Math.ceil(remainingCount / itemsPerPage)
      if (activePage > maxPage && maxPage > 0) {
        setActivePage(maxPage)
      } else if (remainingCount === 0) {
        setActivePage(1)
      }
      
      closeDeleteModal()
      setSubmissionToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete response')
      console.error('Error deleting response:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading responses...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={20} />} title="Error" color="red">
          {error}
        </Alert>
        <Button component={Link} to="/" mt="md" leftSection={<IconArrowLeft size={18} />}>
          Back to Home
        </Button>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center" mb="md">
          <div>
            <Button
              component={Link}
              to="/"
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              mb="sm"
            >
              Back to Home
            </Button>
            <Title order={1} mb="xs">{form?.title || 'Form Responses'}</Title>
            {form?.description && (
              <Text c="dimmed" size="sm">{form.description}</Text>
            )}
          </div>
          <Badge size="xl" color="green" variant="filled" p="md" radius="md">
            <Group gap={6}>
              <IconCheck size={20} />
              <Text fw={700} size="lg">{submissions.length}</Text>
              <Text size="sm" opacity={0.9}>
                {submissions.length === 1 ? 'Response' : 'Responses'}
              </Text>
            </Group>
          </Badge>
        </Group>

        {/* Responses List */}
        {submissions.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md" py="xl">
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--mantine-color-gray-1) 0%, var(--mantine-color-gray-2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconFileText size={40} stroke={1.5} style={{ color: 'var(--mantine-color-gray-6)' }} />
              </Box>
              <Title order={3}>No responses yet</Title>
              <Text c="dimmed" ta="center" maw={400}>
                This form hasn't received any completed submissions yet. Share the form link to start collecting responses.
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap="md">
            {/* Pagination Info and Top Pagination */}
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Showing {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, submissions.length)} of {submissions.length} responses
              </Text>
              {submissions.length > itemsPerPage && (
                <Pagination
                  value={activePage}
                  onChange={setActivePage}
                  total={Math.ceil(submissions.length / itemsPerPage)}
                  size="sm"
                  radius="md"
                  withEdges
                />
              )}
            </Group>

            {/* Responses List */}
            {submissions
              .slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)
              .map((submission, index) => {
                const globalIndex = (activePage - 1) * itemsPerPage + index
                return (
              <Card 
                key={submission.id} 
                shadow="xs" 
                padding="md" 
                radius="md" 
                withBorder
                style={{ 
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  borderLeft: '4px solid var(--mantine-color-indigo-6)'
                }}
              >
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <Badge 
                        size="lg" 
                        variant="filled" 
                        color="indigo"
                        radius="md"
                        style={{ minWidth: 50, justifyContent: 'center' }}
                      >
                        #{submissions.length - globalIndex}
                      </Badge>
                      <div>
                        <Group gap={4} align="center">
                          <IconClock size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
                          <Text size="sm" fw={500}>
                            {/* Parse UTC datetime from backend and display in local timezone */}
                            {new Date(submission.completed_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric'
                            })}
                          </Text>
                          <Text size="sm" c="dimmed">
                            at {new Date(submission.completed_at).toLocaleTimeString(undefined, { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </Text>
                        </Group>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge color="green" variant="light" size="sm" radius="md">
                        Completed
                      </Badge>
                      <ActionIcon
                        color="red"
                        variant="light"
                        size="sm"
                        onClick={() => handleDeleteClick(submission)}
                        title="Delete response"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Divider />

                  {/* Responses - Chip Format */}
                  <Group gap="xs" wrap="wrap">
                    {Object.entries(submission.responses).map(([fieldName, response]) => (
                      <Group key={fieldName} gap={4} style={{ flexWrap: 'nowrap' }}>
                        <Text size="xs" fw={600} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {response.label}:
                        </Text>
                        {response.value ? (
                          <Badge
                            size="md"
                            variant="filled"
                            color="indigo"
                            radius="md"
                            style={{ 
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            {response.value}
                          </Badge>
                        ) : (
                          <Badge
                            size="md"
                            variant="light"
                            color="gray"
                            radius="md"
                            style={{ 
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontStyle: 'italic'
                            }}
                          >
                            No answer
                          </Badge>
                        )}
                        <Badge variant="dot" size="xs" color="blue" radius="md">
                          {response.field_type}
                        </Badge>
                      </Group>
                    ))}
                  </Group>

                  {/* Footer */}
                  <Group justify="space-between" align="center" mt="xs">
                    <Tooltip label={submission.session_id}>
                      <Text size="xs" c="dimmed" ff="monospace" style={{ cursor: 'help' }}>
                        Session: {submission.session_id.substring(0, 16)}...
                      </Text>
                    </Tooltip>
                    <Badge variant="light" size="xs" color="gray" radius="md">
                      {Object.keys(submission.responses).length} {Object.keys(submission.responses).length === 1 ? 'field' : 'fields'}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
                )
              })}

            {/* Pagination Info and Bottom Pagination */}
            {submissions.length > itemsPerPage && (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  Showing {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, submissions.length)} of {submissions.length} responses
                </Text>
                <Pagination
                  value={activePage}
                  onChange={setActivePage}
                  total={Math.ceil(submissions.length / itemsPerPage)}
                  size="sm"
                  radius="md"
                  withEdges
                />
              </Group>
            )}
          </Stack>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="Delete Response"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this response?
            </Text>
            {submissionToDelete && (
              <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" fw={500} mb="xs">Response Details:</Text>
                <Text size="xs" c="dimmed">
                  Submitted: {new Date(submissionToDelete.completed_at).toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">
                  Fields: {Object.keys(submissionToDelete.responses).length}
                </Text>
              </Paper>
            )}
            <Text size="sm" c="dimmed">
              This action cannot be undone. All data associated with this response will be permanently deleted.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteConfirm}
                loading={deleting}
                leftSection={<IconTrash size={16} />}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}

export default FormResponses

