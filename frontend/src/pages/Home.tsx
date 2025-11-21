import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Title, Text, Button, Card, Grid, Stack, Loader, Alert, Group, Badge } from '@mantine/core'
import { IconFileText, IconPlus, IconCalendar, IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import { formAPI, Form } from '../services/api'

function Home() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="lg" mb="xl">
        <IconFileText size={64} stroke={1.5} style={{ color: 'var(--mantine-color-indigo-6)' }} />
        <Title order={1} size="3.5rem" fw={800} ta="center">
          Dynamic Form Engine
        </Title>
        <Text size="xl" c="dimmed" ta="center" maw={600}>
          Create and fill out dynamic, multi-page forms with conditional logic and intelligent navigation
        </Text>
        <Button
          component={Link}
          to="/builder"
          size="lg"
          leftSection={<IconPlus size={20} />}
          variant="gradient"
          gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
        >
          Create New Form
        </Button>
      </Stack>

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
          <Title order={2}>Available Forms</Title>
          {forms.length === 0 ? (
            <Card shadow="md" padding="xl" radius="md" withBorder>
              <Stack align="center" gap="md">
                <IconFileText size={48} stroke={1.5} style={{ color: 'var(--mantine-color-gray-4)' }} />
                <Title order={3}>No forms available yet</Title>
                <Text c="dimmed" ta="center">
                  Get started by creating your first dynamic form
                </Text>
                <Button
                  component={Link}
                  to="/builder"
                  leftSection={<IconPlus size={18} />}
                  variant="light"
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
                    component={Link}
                    to={`/form/${form.id}`}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    className="hover-card"
                  >
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <IconFileText size={32} stroke={1.5} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                        <Badge color="green" variant="light">Active</Badge>
                      </Group>
                      <div>
                        <Title order={4} mb="xs">{form.title}</Title>
                        {form.description && (
                          <Text size="sm" c="dimmed" lineClamp={2}>
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
                        <Button
                          size="xs"
                          variant="light"
                          rightSection={<IconArrowRight size={14} />}
                        >
                          Start
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
    </Container>
  )
}

export default Home
