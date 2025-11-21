import { Link, useParams } from 'react-router-dom'
import { Container, Card, Title, Text, Button, Stack, Group } from '@mantine/core'
import { IconCheck, IconHome, IconRefresh } from '@tabler/icons-react'

function FormComplete() {
  const { formId } = useParams<{ formId: string }>()

  return (
    <Container size="sm" py="xl">
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            background: 'var(--mantine-color-green-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconCheck size={48} stroke={2} style={{ color: 'var(--mantine-color-green-6)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title order={2} mb="xs">Form Completed!</Title>
            <Text c="dimmed">
              Thank you for completing the form. Your responses have been saved.
            </Text>
          </div>
          <Stack gap="sm" style={{ width: '100%' }}>
            <Button
              component={Link}
              to="/"
              fullWidth
              size="md"
              leftSection={<IconHome size={18} />}
              variant="gradient"
              gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
            >
              Back to Home
            </Button>
            {formId && (
              <Button
                component={Link}
                to={`/form/${formId}`}
                fullWidth
                size="md"
                variant="light"
                leftSection={<IconRefresh size={18} />}
              >
                Fill Again
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>
    </Container>
  )
}

export default FormComplete
