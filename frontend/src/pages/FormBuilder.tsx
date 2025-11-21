import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Stack,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  NumberInput,
  Stepper,
  Group,
  Badge,
  Alert,
  Paper,
  ActionIcon,
  Loader,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconArrowLeft, IconPlus, IconTrash, IconCheck, IconAlertCircle, IconEdit } from '@tabler/icons-react'
import { builderAPI, Form, Page, Field } from '../services/api'

type BuilderStep = 'form' | 'pages' | 'fields' | 'complete'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'rating', label: 'Rating' },
]

function FormBuilder() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId?: string }>()
  const [activeStep, setActiveStep] = useState(0)
  const [currentForm, setCurrentForm] = useState<Form | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [pages, setPages] = useState<Page[]>([])
  const [currentPage, setCurrentPage] = useState<Page | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form creation state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // Page creation state
  const [pageTitle, setPageTitle] = useState('')
  const [pageDescription, setPageDescription] = useState('')
  const [isFirstPage, setIsFirstPage] = useState(false)

  // Field creation state
  const [fieldName, setFieldName] = useState('')
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [fieldPlaceholder, setFieldPlaceholder] = useState('')
  const [fieldHelpText, setFieldHelpText] = useState('')
  const [fieldRequired, setFieldRequired] = useState(false)

  // Options for select/radio/checkbox
  const [fieldChoices, setFieldChoices] = useState<Array<{ value: string; label: string }>>([])
  const [newChoiceValue, setNewChoiceValue] = useState('')
  const [newChoiceLabel, setNewChoiceLabel] = useState('')

  // Rating configuration
  const [ratingMin, setRatingMin] = useState(1)
  const [ratingMax, setRatingMax] = useState(5)

  // Edit mode state
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
  
  // Delete modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [deletingForm, setDeletingForm] = useState(false)

  // Load form data when editing
  useEffect(() => {
    const loadFormForEdit = async () => {
      if (formId) {
        try {
          setLoading(true)
          setError(null)
          const form = await builderAPI.getForm(parseInt(formId))
          if (form) {
            setCurrentForm(form)
            setIsEditMode(true)
            setFormTitle(form.title)
            setFormDescription(form.description || '')
            
            // Load pages for this form
            const formPages = await builderAPI.getPages(form.id)
            setPages(formPages)
            
            // If pages exist, go to pages step, otherwise start at form step
            if (formPages.length > 0) {
              setActiveStep(1)
            } else {
              setActiveStep(0)
            }
          } else {
            setError('Form not found')
            navigate('/builder')
          }
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to load form')
          console.error('Error loading form:', err)
        } finally {
          setLoading(false)
        }
      } else {
        // Reset to create mode when no formId
        setIsEditMode(false)
        setCurrentForm(null)
        setPages([])
        setFormTitle('')
        setFormDescription('')
        setActiveStep(0)
      }
    }

    loadFormForEdit()
  }, [formId, navigate])

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setError('Form title is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      if (isEditMode && currentForm) {
        // Update existing form
        const form = await builderAPI.updateForm(currentForm.id, {
          title: formTitle,
          description: formDescription || undefined,
        })
        setCurrentForm(form)
        setActiveStep(1)
      } else {
        // Create new form
        const form = await builderAPI.createForm({
          title: formTitle,
          description: formDescription || undefined,
          is_active: true,
        })
        setCurrentForm(form)
        setActiveStep(1)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} form`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentForm || !pageTitle.trim()) {
      setError('Page title is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const page = await builderAPI.createPage({
        form_id: currentForm.id,
        title: pageTitle,
        description: pageDescription || undefined,
        order: pages.length + 1,
        is_first: isFirstPage || pages.length === 0,
      })
      // Reload all pages to get updated is_first status (backend ensures only one is first)
      const updatedPages = await builderAPI.getPages(currentForm.id)
      setPages(updatedPages)
      setCurrentPage(page)
      setPageTitle('')
      setPageDescription('')
      setIsFirstPage(false)
      setActiveStep(2)
      await loadFields(page.id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create page')
    } finally {
      setLoading(false)
    }
  }

  const loadFields = async (pageId: number) => {
    try {
      const pageFields = await builderAPI.getFields(pageId)
      setFields(pageFields)
    } catch (err: any) {
      console.error('Error loading fields:', err)
    }
  }

  const loadPages = async () => {
    if (!currentForm) return
    try {
      const formPages = await builderAPI.getPages(currentForm.id)
      setPages(formPages)
    } catch (err: any) {
      console.error('Error loading pages:', err)
    }
  }

  // Reload pages when navigating to step 1 (pages)
  useEffect(() => {
    if (activeStep === 1 && currentForm) {
      loadPages()
    }
  }, [activeStep, currentForm])

  const handlePageSelect = async (page: Page) => {
    setCurrentPage(page)
    setActiveStep(2)
    await loadFields(page.id)
  }

  const handleAddChoice = () => {
    if (newChoiceValue.trim() && newChoiceLabel.trim()) {
      setFieldChoices([...fieldChoices, { value: newChoiceValue, label: newChoiceLabel }])
      setNewChoiceValue('')
      setNewChoiceLabel('')
    }
  }

  const handleRemoveChoice = (index: number) => {
    setFieldChoices(fieldChoices.filter((_, i) => i !== index))
  }

  const handleFieldTypeChange = (newType: string) => {
    setFieldType(newType)
    if (newType !== 'select' && newType !== 'radio' && newType !== 'checkbox') {
      setFieldChoices([])
    }
    if (newType !== 'rating') {
      setRatingMin(1)
      setRatingMax(5)
    }
  }

  const handleEditField = (field: Field) => {
    setEditingFieldId(field.id)
    setFieldName(field.name)
    setFieldLabel(field.label)
    setFieldType(field.field_type)
    setFieldPlaceholder(field.placeholder || '')
    setFieldHelpText(field.help_text || '')
    setFieldRequired(field.is_required)

    // Parse options for select/radio/checkbox
    if (field.options?.choices) {
      setFieldChoices(field.options.choices)
    } else {
      setFieldChoices([])
    }

    // Parse options for rating
    if (field.options?.min !== undefined) {
      setRatingMin(field.options.min)
    }
    if (field.options?.max !== undefined) {
      setRatingMax(field.options.max)
    }
  }

  const handleCancelEdit = () => {
    setEditingFieldId(null)
    setFieldName('')
    setFieldLabel('')
    setFieldType('text')
    setFieldPlaceholder('')
    setFieldHelpText('')
    setFieldRequired(false)
    setFieldChoices([])
    setNewChoiceValue('')
    setNewChoiceLabel('')
    setRatingMin(1)
    setRatingMax(5)
  }

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('Are you sure you want to delete this field?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await builderAPI.deleteField(fieldId)
      setFields(fields.filter(f => f.id !== fieldId))
      if (editingFieldId === fieldId) {
        handleCancelEdit()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete field')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPage || !fieldName.trim() || !fieldLabel.trim()) {
      setError('Field name and label are required')
      return
    }

    if ((fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && fieldChoices.length === 0) {
      setError('Please add at least one option')
      return
    }

    if (fieldType === 'rating' && ratingMin >= ratingMax) {
      setError('Rating minimum must be less than maximum')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let parsedOptions: Record<string, any> | undefined

      if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
        parsedOptions = { choices: fieldChoices }
      } else if (fieldType === 'rating') {
        parsedOptions = { min: ratingMin, max: ratingMax }
      }

      if (editingFieldId) {
        // Update existing field
        const updatedField = await builderAPI.updateField(editingFieldId, {
          name: fieldName,
          label: fieldLabel,
          field_type: fieldType,
          placeholder: fieldPlaceholder || undefined,
          help_text: fieldHelpText || undefined,
          is_required: fieldRequired,
          options: parsedOptions,
        })

        setFields(fields.map(f => f.id === editingFieldId ? updatedField : f))
        handleCancelEdit()
      } else {
        // Create new field
        const field = await builderAPI.createField({
          page_id: currentPage.id,
          name: fieldName,
          label: fieldLabel,
          field_type: fieldType,
          placeholder: fieldPlaceholder || undefined,
          help_text: fieldHelpText || undefined,
          order: fields.length + 1,
          is_required: fieldRequired,
          is_visible: true,
          options: parsedOptions,
        })

        setFields([...fields, field])
        handleCancelEdit()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save field')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (currentForm) {
      navigate(`/form/${currentForm.id}`)
    }
  }

  const handleDeleteForm = async () => {
    if (!currentForm || !isEditMode) return

    try {
      setDeletingForm(true)
      setError(null)
      await builderAPI.deleteForm(currentForm.id)
      // Navigate to home after successful deletion
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete form')
      closeDeleteModal()
    } finally {
      setDeletingForm(false)
    }
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="md">
            <Button
              component={Link}
              to="/"
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
            >
              Back to Home
            </Button>
            {isEditMode && currentForm && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={18} />}
                onClick={openDeleteModal}
              >
                Delete Form
              </Button>
            )}
          </Group>
          <Title order={1} size="2.5rem">
            {isEditMode ? 'Edit Form' : 'Form Builder'}
          </Title>
          <Text c="dimmed" size="lg">
            {isEditMode ? `Editing: ${currentForm?.title}` : 'Create dynamic forms with conditional logic'}
          </Text>
        </div>

        {/* Stepper */}
        <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm">
          <Stepper.Step label="Form" description={isEditMode ? "Edit form" : "Create form"} />
          <Stepper.Step label="Pages" description="Add pages" />
          <Stepper.Step label="Fields" description="Add fields" />
          <Stepper.Completed>Completed! Form is ready.</Stepper.Completed>
        </Stepper>

        {loading && formId && !currentForm && (
          <Stack align="center" py="xl">
            <Loader size="lg" />
            <Text c="dimmed">Loading form data...</Text>
          </Stack>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={20} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Step 1: Create/Edit Form */}
        {activeStep === 0 && (
          <Card shadow="md" padding="xl" radius="md" withBorder>
            <Title order={2} mb="lg">{isEditMode ? 'Edit Form' : 'Create Form'}</Title>
            <form onSubmit={handleCreateForm}>
              <Stack gap="md">
                <TextInput
                  label="Form Title"
                  placeholder="e.g., Customer Feedback Survey"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.currentTarget.value)}
                  required
                  size="md"
                />
                <Textarea
                  label="Description"
                  placeholder="Brief description of the form"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.currentTarget.value)}
                  rows={3}
                  size="md"
                />
                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="md"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                >
                  {isEditMode ? 'Update Form' : 'Create Form'}
                </Button>
              </Stack>
            </form>
          </Card>
        )}

        {/* Step 2: Create Pages */}
        {activeStep === 1 && currentForm && (
          <Card shadow="md" padding="xl" radius="md" withBorder>
            <Title order={2} mb="lg">Add Pages to "{currentForm.title}"</Title>
            <form onSubmit={handleCreatePage}>
              <Stack gap="md">
                <TextInput
                  label="Page Title"
                  placeholder="e.g., Basic Information"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.currentTarget.value)}
                  required
                  size="md"
                />
                <Textarea
                  label="Description"
                  placeholder="Page description"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.currentTarget.value)}
                  rows={2}
                  size="md"
                />
                <Checkbox
                  label="Mark as first page"
                  description={pages.some(p => p.is_first) ? "Note: This will unmark the current first page" : "This will be the starting page of the form"}
                  checked={isFirstPage}
                  onChange={(e) => setIsFirstPage(e.currentTarget.checked)}
                />
                <Group>
                  <Button
                    type="submit"
                    loading={loading}
                    leftSection={<IconPlus size={18} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                  >
                    Add Page
                  </Button>
                  {pages.length > 0 && (
                    <Button
                      variant="light"
                      onClick={() => setActiveStep(2)}
                    >
                      Next: Add Fields
                    </Button>
                  )}
                </Group>
              </Stack>
            </form>
            {pages.length > 0 && (
              <Stack gap="md" mt="xl">
                <Title order={4}>Pages Created:</Title>
                {pages.map((page) => (
                  <Paper key={page.id} p="md" withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{page.title}</Text>
                        {page.is_first && (
                          <Badge color="indigo" variant="light" size="sm" mt="xs">
                            First Page
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => handlePageSelect(page)}
                      >
                        Add Fields
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        )}

        {/* Step 3: Create Fields */}
        {activeStep === 2 && currentPage && currentForm && (
          <Card shadow="md" padding="xl" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
              <Title order={2}>Add Fields to "{currentPage.title}"</Title>
              {pages.length > 1 && (
                <Select
                  value={currentPage.id.toString()}
                  onChange={(val) => {
                    const page = pages.find((p) => p.id === parseInt(val || '0'))
                    if (page) handlePageSelect(page)
                  }}
                  data={pages.map((page) => ({
                    value: page.id.toString(),
                    label: page.title,
                  }))}
                  style={{ width: 200 }}
                />
              )}
            </Group>
            <form onSubmit={handleCreateField}>
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="Field Name"
                    placeholder="e.g., email, age"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.currentTarget.value)}
                    required
                    size="md"
                  />
                  <TextInput
                    label="Field Label"
                    placeholder="e.g., Email Address"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.currentTarget.value)}
                    required
                    size="md"
                  />
                </Group>
                <Select
                  label="Field Type"
                  value={fieldType}
                  onChange={(val) => handleFieldTypeChange(val || 'text')}
                  data={FIELD_TYPES}
                  required
                  size="md"
                />
                <TextInput
                  label="Placeholder"
                  placeholder="Enter placeholder text"
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.currentTarget.value)}
                  size="md"
                />
                <TextInput
                  label="Help Text"
                  placeholder="Additional help text"
                  value={fieldHelpText}
                  onChange={(e) => setFieldHelpText(e.currentTarget.value)}
                  size="md"
                />

                {/* Options UI for select/radio/checkbox */}
                {(fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && (
                  <Paper p="md" withBorder>
                    <Text fw={500} size="sm" mb="md">
                      Options <Text component="span" c="red">*</Text>
                    </Text>
                    {fieldChoices.length > 0 && (
                      <Stack gap="xs" mb="md">
                        {fieldChoices.map((choice, index) => (
                          <Paper key={index} p="sm" withBorder>
                            <Group justify="space-between">
                              <div>
                                <Text fw={500} size="sm">{choice.label}</Text>
                                <Text size="xs" c="dimmed">value: {choice.value}</Text>
                              </div>
                              <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => handleRemoveChoice(index)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                    <Group grow>
                      <TextInput
                        placeholder="Value (e.g., option1)"
                        value={newChoiceValue}
                        onChange={(e) => setNewChoiceValue(e.currentTarget.value)}
                        size="sm"
                      />
                      <TextInput
                        placeholder="Label (e.g., Option 1)"
                        value={newChoiceLabel}
                        onChange={(e) => setNewChoiceLabel(e.currentTarget.value)}
                        size="sm"
                      />
                    </Group>
                    <Button
                      type="button"
                      onClick={handleAddChoice}
                      disabled={!newChoiceValue.trim() || !newChoiceLabel.trim()}
                      leftSection={<IconPlus size={16} />}
                      variant="light"
                      fullWidth
                      mt="sm"
                      size="sm"
                    >
                      Add Option
                    </Button>
                    {fieldChoices.length === 0 && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Add at least one option for this field type
                      </Text>
                    )}
                  </Paper>
                )}

                {/* Rating configuration */}
                {fieldType === 'rating' && (
                  <Paper p="md" withBorder>
                    <Text fw={500} size="sm" mb="md">Rating Range</Text>
                    <Group grow>
                      <NumberInput
                        label="Minimum"
                        value={ratingMin}
                        onChange={(val) => setRatingMin(Number(val) || 1)}
                        min={1}
                        size="md"
                      />
                      <NumberInput
                        label="Maximum"
                        value={ratingMax}
                        onChange={(val) => setRatingMax(Number(val) || 5)}
                        min={ratingMin + 1}
                        size="md"
                      />
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">
                      Rating will be from {ratingMin} to {ratingMax} stars
                    </Text>
                  </Paper>
                )}

                <Checkbox
                  label="Required field"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.currentTarget.checked)}
                />

                <Group>
                  <Button
                    type="submit"
                    loading={loading}
                    leftSection={editingFieldId ? <IconCheck size={18} /> : <IconPlus size={18} />}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                  >
                    {editingFieldId ? 'Update Field' : 'Add Field'}
                  </Button>
                  {editingFieldId && (
                    <Button
                      variant="light"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="light"
                    onClick={() => setActiveStep(1)}
                  >
                    Add More Pages
                  </Button>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'green', to: 'teal', deg: 90 }}
                    onClick={() => {
                      setActiveStep(3)
                      setCurrentPage(null)
                    }}
                  >
                    Finish
                  </Button>
                </Group>
              </Stack>
            </form>
            {fields.length > 0 && (
              <Stack gap="md" mt="xl">
                <Title order={4}>Fields Added:</Title>
                {fields.map((field) => (
                  <Paper 
                    key={field.id} 
                    p="md" 
                    withBorder
                    style={{ 
                      borderColor: editingFieldId === field.id ? 'var(--mantine-color-indigo-6)' : undefined,
                      borderWidth: editingFieldId === field.id ? 2 : undefined
                    }}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{field.label}</Text>
                        <Text size="xs" c="dimmed" mt={2}>{field.name}</Text>
                        <Group gap="xs" mt={4}>
                          <Badge variant="light" size="sm">{field.field_type}</Badge>
                          {field.is_required && (
                            <Badge color="red" variant="light" size="sm">Required</Badge>
                          )}
                          {editingFieldId === field.id && (
                            <Badge color="indigo" variant="light" size="sm">Editing</Badge>
                          )}
                        </Group>
                      </div>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEditField(field)}
                          disabled={editingFieldId === field.id}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDeleteField(field.id)}
                          disabled={loading}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        )}

        {/* Step 4: Complete */}
        {activeStep === 3 && currentForm && (
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
                <Title order={2} mb="xs">Form Created!</Title>
                <Text c="dimmed" size="lg">
                  Your form "{currentForm.title}" has been created successfully.
                </Text>
              </div>
              <Group>
                <Button
                  onClick={handleFinish}
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                >
                  View Form
                </Button>
                <Button
                  component={Link}
                  to="/builder"
                  variant="light"
                  size="lg"
                >
                  Create Another Form
                </Button>
              </Group>
            </Stack>
          </Card>
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
              Are you sure you want to delete <strong>{currentForm?.title}</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              This action cannot be undone. All pages, fields, and submissions associated with this form will be permanently deleted.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeleteModal}
                disabled={deletingForm}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteForm}
                loading={deletingForm}
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

export default FormBuilder
