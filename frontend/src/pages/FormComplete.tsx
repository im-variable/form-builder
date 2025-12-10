import { Link, useParams } from 'react-router-dom'
import { Container, Card, Title, Text, Button, Stack, Group } from '@mantine/core'
import { IconCheck, IconHome, IconRefresh } from '@tabler/icons-react'

function FormComplete() {
  const { formId } = useParams<{ formId: string }>()

  return (
    <Container size="sm" py="xl">
      <Card shadow="lg" padding="xl" radius="xl" withBorder style={{ 
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        <Stack align="center" gap="xl">
          <div style={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            position: 'relative',
          }}>
            <IconCheck size={64} stroke={3} style={{ color: '#6366f1' }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title order={2} mb="md" style={{ 
              letterSpacing: '-0.02em',
              fontWeight: 700,
            }}>
              Form Completed!
            </Title>
            <Text c="dimmed" size="md" style={{ 
              lineHeight: 1.7,
              color: '#64748b',
            }}>
              Thank you for completing the form. Your responses have been saved.
            </Text>
          </div>
          <Stack gap="sm" style={{ width: '100%', marginTop: '0.5rem' }}>
            <Button
              component={Link}
              to="/"
              fullWidth
              size="lg"
              leftSection={<IconHome size={20} />}
              color="indigo"
              style={{ 
                padding: '0.875rem 1.5rem',
                fontWeight: 600,
              }}
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
                color="violet"
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
