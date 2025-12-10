import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Title, Text, Button, Card, Grid, Stack, Loader, Alert, Group, Badge, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconFileText, IconPlus, IconCalendar, IconArrowRight, IconAlertCircle, IconEdit, IconTrash, IconList } from '@tabler/icons-react'
import { formAPI, builderAPI, Form } from '../services/api'

function Home() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [formToDelete, setFormToDelete] = useState<Form | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      const data = await formAPI.getForms()
      setForms(data.filter((f) => f.is_active))
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load forms')
      console.error('Error loading forms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form)
    openDeleteModal()
  }

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return

    try {
      setDeleting(true)
      setError(null)
      await builderAPI.deleteForm(formToDelete.id)
      // Reload forms after deletion
      await loadForms()
      closeDeleteModal()
      setFormToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete form')
      console.error('Error deleting form:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Card shadow="lg" padding="xl" radius="xl" withBorder mb="xl">
        <Stack align="center" gap="xl">
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-colored)',
          }}>
            <IconFileText size={48} stroke={2.5} style={{ color: 'white' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title order={1} size="3.5rem" fw={800} ta="center" style={{ 
              color: '#334155',
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}>
              Dynamic Form Engine
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600} style={{ 
              lineHeight: 1.7,
              fontSize: '1.125rem',
              color: '#64748b',
            }}>
              Create and fill out dynamic, multi-page forms with conditional logic and intelligent navigation
            </Text>
          </div>
          <Button
            component={Link}
            to="/builder"
            size="lg"
            leftSection={<IconPlus size={22} />}
            color="indigo"
            style={{ 
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              marginTop: '0.5rem',
            }}
          >
            Create New Form
          </Button>
        </Stack>
      </Card>

      {loading && (
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">Loading forms...</Text>
        </Stack>
      )}

      {error && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Error"
          color="red"
          mb="xl"
        >
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Stack gap="xl">
          <div>
            <Title order={2} mb="xs" style={{ letterSpacing: '-0.02em' }}>Available Forms</Title>
            <Text size="sm" c="dimmed">Manage and access all your dynamic forms</Text>
          </div>
          {forms.length === 0 ? (
            <Card shadow="md" padding="xl" radius="lg" withBorder style={{ 
              borderStyle: 'dashed',
            }}>
              <Stack align="center" gap="md">
                <IconFileText size={48} stroke={1.5} style={{ color: '#cbd5e1' }} />
                <Title order={3}>No forms available yet</Title>
                <Text c="dimmed" ta="center">
                  Get started by creating your first dynamic form
                </Text>
                <Button
                  component={Link}
                  to="/builder"
                  leftSection={<IconPlus size={18} />}
                  variant="light"
                  color="indigo"
                >
                  Create your first form
                </Button>
              </Stack>
            </Card>
          ) : (
            <Grid>
              {forms.map((form) => (
                <Grid.Col key={form.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="lg"
                    withBorder
                    className="hover-card"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Stack gap="md" style={{ flex: 1 }}>
                      <Group justify="space-between" align="flex-start">
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}>
                          <IconFileText size={28} stroke={2} style={{ color: 'white' }} />
                        </div>
                        <Badge color="indigo" variant="light" size="sm" radius="md" style={{ 
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                        }}>
                          Active
                        </Badge>
                      </Group>
                      <div style={{ flex: 1 }}>
                        <Title order={4} mb="xs" style={{ 
                          letterSpacing: '-0.01em',
                          fontWeight: 600,
                        }}>
                          {form.title}
                        </Title>
                        {form.description && (
                          <Text size="sm" c="dimmed" lineClamp={2} style={{ 
                            lineHeight: 1.6,
                            color: '#64748b',
                          }}>
                            {form.description}
                          </Text>
                        )}
                      </div>
                      <Group justify="space-between" mt="auto">
                        <Group gap={4}>
                          <IconCalendar size={14} />
                          <Text size="xs" c="dimmed">
                            {new Date(form.created_at).toLocaleDateString()}
                          </Text>
                        </Group>
                      </Group>
                      <Group gap="xs" mt="xs">
                        <Button
                          component={Link}
                          to={`/form/${form.id}`}
                          size="xs"
                          variant="light"
                          rightSection={<IconArrowRight size={14} />}
                          style={{ flex: 1 }}
                        >
                          Start
                        </Button>
                        <Button
                          component={Link}
                          to={`/responses/${form.id}`}
                          size="xs"
                          variant="light"
                          color="green"
                          leftSection={<IconList size={14} />}
                          style={{ flex: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          component={Link}
                          to={`/builder/${form.id}`}
                          size="xs"
                          variant="light"
                          color="blue"
                          leftSection={<IconEdit size={14} />}
                          style={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteClick(form)
                          }}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Form"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{formToDelete?.title}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            This action cannot be undone. All pages, fields, and submissions associated with this form will be permanently deleted.
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
    </Container>
  )
}

export default Home
