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
  Grid,
  ScrollArea,
  Divider,
  Radio,
  Switch,
  Rating,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconArrowLeft, IconPlus, IconTrash, IconCheck, IconAlertCircle, IconEdit, IconArrowUp, IconArrowDown, IconEye, IconPin, IconRoute, IconPlayerPlay, IconFilter } from '@tabler/icons-react'
import { builderAPI, Form, Page, Field } from '../services/api'

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
  
  // Delete page modal state
  const [deletePageModalOpened, { open: openDeletePageModal, close: closeDeletePageModal }] = useDisclosure(false)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  
  // Delete field modal state
  const [deleteFieldModalOpened, { open: openDeleteFieldModal, close: closeDeleteFieldModal }] = useDisclosure(false)
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null)
  
  // Delete navigation rule modal state
  const [deleteRuleModalOpened, { open: openDeleteRuleModal, close: closeDeleteRuleModal }] = useDisclosure(false)
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null)
  
  // Delete field condition modal state
  const [deleteConditionModalOpened, { open: openDeleteConditionModal, close: closeDeleteConditionModal }] = useDisclosure(false)
  const [conditionToDelete, setConditionToDelete] = useState<number | null>(null)
  
  // Preview modal state
  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false)
  
  // Navigation rules state
  const [navigationRulesModalOpened, { open: openNavigationRulesModal, close: closeNavigationRulesModal }] = useDisclosure(false)
  const [selectedPageForRules, setSelectedPageForRules] = useState<Page | null>(null)
  const [navigationRules, setNavigationRules] = useState<any[]>([])
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  
  // Navigation rule form state
  const [ruleSourceFieldId, setRuleSourceFieldId] = useState<string>('')
  const [ruleOperator, setRuleOperator] = useState<string>('equals')
  const [ruleValue, setRuleValue] = useState<string>('')
  const [ruleTargetPageId, setRuleTargetPageId] = useState<string>('')
  const [ruleIsDefault, setRuleIsDefault] = useState(false)

  // Field conditions state
  const [fieldConditionsModalOpened, { open: openFieldConditionsModal, close: closeFieldConditionsModal }] = useDisclosure(false)
  const [selectedFieldForConditions, setSelectedFieldForConditions] = useState<Field | null>(null)
  const [fieldConditions, setFieldConditions] = useState<any[]>([])
  const [conditionSourcePageId, setConditionSourcePageId] = useState<string>('')
  const [conditionSourceFieldId, setConditionSourceFieldId] = useState<string>('')
  const [conditionOperator, setConditionOperator] = useState<string>('equals')
  const [conditionValue, setConditionValue] = useState<string>('')
  const [conditionAction, setConditionAction] = useState<string>('show')
  const [sourcePageFields, setSourcePageFields] = useState<Field[]>([])

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
      // Sort fields by order to ensure correct display
      const sortedFields = [...pageFields].sort((a, b) => (a.order || 0) - (b.order || 0))
      setFields(sortedFields)
    } catch (err: any) {
      console.error('Error loading fields:', err)
    }
  }

  const loadPages = async () => {
    if (!currentForm) return
    try {
      const formPages = await builderAPI.getPages(currentForm.id)
      // Sort pages: first page always on top, then others by order
      const sortedPages = [...formPages].sort((a, b) => {
        // If one is first page, it should come first
        if (a.is_first && !b.is_first) return -1
        if (!a.is_first && b.is_first) return 1
        // Otherwise sort by order
        return (a.order || 0) - (b.order || 0)
      })
      setPages(sortedPages)
    } catch (err: any) {
      console.error('Error loading pages:', err)
    }
  }

  const handleMovePage = async (pageId: number, direction: 'up' | 'down') => {
    const pageIndex = pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return

    const currentPage = pages[pageIndex]
    
    // Don't allow moving the first page
    if (currentPage.is_first) {
      setError('The first page cannot be reordered')
      return
    }

    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1
    if (newIndex < 0 || newIndex >= pages.length) return

    const targetPage = pages[newIndex]
    
    // Don't allow swapping with the first page
    if (targetPage.is_first) {
      setError('Cannot move pages before the first page')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Swap the order values
      const tempOrder = currentPage.order || pageIndex + 1
      const targetOrder = targetPage.order || newIndex + 1

      // Update both pages
      await builderAPI.updatePage(currentPage.id, { order: targetOrder })
      await builderAPI.updatePage(targetPage.id, { order: tempOrder })

      // Reload pages to get updated order
      if (currentForm) {
        await loadPages()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reorder page')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePage = (page: Page) => {
    setPageToDelete(page)
    openDeletePageModal()
  }

  const handleDeletePageConfirm = async () => {
    if (!pageToDelete) return

    try {
      setLoading(true)
      setError(null)
      await builderAPI.deletePage(pageToDelete.id)
      // Reload pages after deletion
      if (currentForm) {
        await loadPages()
      }
      // If we deleted the current page, clear it
      if (currentPage && currentPage.id === pageToDelete.id) {
        setCurrentPage(null)
        setFields([])
      }
      closeDeletePageModal()
      setPageToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete page')
    } finally {
      setLoading(false)
    }
  }

  const handleSetAsFirstPage = async (pageId: number) => {
    try {
      setLoading(true)
      setError(null)
      await builderAPI.updatePage(pageId, { is_first: true })
      // Reload pages to get updated is_first status
      if (currentForm) {
        await loadPages()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set page as first')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNavigationRules = async (page: Page) => {
    setSelectedPageForRules(page)
    try {
      setLoading(true)
      // Load fields for this page
      const pageFields = await builderAPI.getFields(page.id)
      setFields(pageFields)
      // Load navigation rules
      const rules = await builderAPI.getNavigationRules(page.id)
      setNavigationRules(rules)
      openNavigationRulesModal()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load navigation rules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNavigationRule = async () => {
    if (!selectedPageForRules) return

    try {
      setLoading(true)
      setError(null)
      await builderAPI.createNavigationRule({
        page_id: selectedPageForRules.id,
        source_field_id: ruleSourceFieldId ? parseInt(ruleSourceFieldId) : undefined,
        operator: ruleOperator,
        value: ruleValue || undefined,
        target_page_id: ruleTargetPageId ? parseInt(ruleTargetPageId) : undefined,
        is_default: ruleIsDefault,
      })
      // Reload rules
      const rules = await builderAPI.getNavigationRules(selectedPageForRules.id)
      setNavigationRules(rules)
      // Reset form
      setRuleSourceFieldId('')
      setRuleOperator('equals')
      setRuleValue('')
      setRuleTargetPageId('')
      setRuleIsDefault(false)
      setEditingRuleId(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create navigation rule')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNavigationRule = (ruleId: number) => {
    setRuleToDelete(ruleId)
    openDeleteRuleModal()
  }

  const handleDeleteNavigationRuleConfirm = async () => {
    if (!ruleToDelete) return

    try {
      setLoading(true)
      setError(null)
      await builderAPI.deleteNavigationRule(ruleToDelete)
      if (selectedPageForRules) {
        const rules = await builderAPI.getNavigationRules(selectedPageForRules.id)
        setNavigationRules(rules)
      }
      closeDeleteRuleModal()
      setRuleToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete navigation rule')
    } finally {
      setLoading(false)
    }
  }

  // Field conditions handlers
  const handleOpenFieldConditions = async (field: Field) => {
    setSelectedFieldForConditions(field)
    try {
      setLoading(true)
      const conditions = await builderAPI.getFieldConditions(field.id)
      setFieldConditions(conditions)
      openFieldConditionsModal()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load field conditions')
    } finally {
      setLoading(false)
    }
  }

  const handleConditionSourcePageChange = async (pageId: string) => {
    setConditionSourcePageId(pageId)
    setConditionSourceFieldId('') // Reset field selection
    if (pageId && currentForm) {
      try {
        const pageFields = await builderAPI.getFields(parseInt(pageId))
        setSourcePageFields(pageFields)
      } catch (err: any) {
        console.error('Error loading fields for page:', err)
        setSourcePageFields([])
      }
    } else {
      setSourcePageFields([])
    }
  }

  const handleCreateFieldCondition = async () => {
    if (!selectedFieldForConditions || !conditionSourceFieldId || !conditionAction) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await builderAPI.createFieldCondition({
        source_field_id: parseInt(conditionSourceFieldId),
        target_field_id: selectedFieldForConditions.id,
        operator: conditionOperator,
        value: conditionValue || undefined,
        action: conditionAction,
      })
      
      // Reload conditions
      const conditions = await builderAPI.getFieldConditions(selectedFieldForConditions.id)
      setFieldConditions(conditions)
      
      // Reset form
      setConditionSourcePageId('')
      setConditionSourceFieldId('')
      setConditionOperator('equals')
      setConditionValue('')
      setConditionAction('show')
      setSourcePageFields([])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create field condition')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFieldCondition = (conditionId: number) => {
    setConditionToDelete(conditionId)
    openDeleteConditionModal()
  }

  const handleDeleteFieldConditionConfirm = async () => {
    if (!conditionToDelete) return

    try {
      setLoading(true)
      setError(null)
      await builderAPI.deleteFieldCondition(conditionToDelete)
      if (selectedFieldForConditions) {
        const conditions = await builderAPI.getFieldConditions(selectedFieldForConditions.id)
        setFieldConditions(conditions)
      }
      closeDeleteConditionModal()
      setConditionToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete field condition')
    } finally {
      setLoading(false)
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

  const handleDeleteField = (field: Field) => {
    setFieldToDelete(field)
    openDeleteFieldModal()
  }

  const handleDeleteFieldConfirm = async () => {
    if (!fieldToDelete) return

    try {
      setLoading(true)
      setError(null)
      await builderAPI.deleteField(fieldToDelete.id)
      setFields(fields.filter(f => f.id !== fieldToDelete.id))
      if (editingFieldId === fieldToDelete.id) {
        handleCancelEdit()
      }
      closeDeleteFieldModal()
      setFieldToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete field')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveField = async (fieldId: number, direction: 'up' | 'down') => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId)
    if (fieldIndex === -1) return

    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    try {
      setLoading(true)
      setError(null)

      // Swap the order values
      const currentField = fields[fieldIndex]
      const targetField = fields[newIndex]
      const tempOrder = currentField.order || fieldIndex + 1
      const targetOrder = targetField.order || newIndex + 1

      // Update both fields
      await builderAPI.updateField(currentField.id, { order: targetOrder })
      await builderAPI.updateField(targetField.id, { order: tempOrder })

      // Reload fields to get updated order
      if (currentPage) {
        await loadFields(currentPage.id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reorder field')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPage) {
      setError('Please select a page first')
      return
    }
    if (!fieldName.trim() || !fieldLabel.trim()) {
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
    navigate('/')
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
            {currentForm && isEditMode && (
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
        <Stepper active={activeStep} onStepClick={(step) => {
          // Prevent going to Fields step if no pages exist
          if (step === 2 && pages.length === 0) {
            setError('Please create at least one page before adding fields')
            return
          }
          // Auto-select first page when going to Fields step if pages exist but none selected
          if (step === 2 && pages.length > 0 && !currentPage) {
            handlePageSelect(pages[0])
          }
          setActiveStep(step)
        }}>
          <Stepper.Step label="Form" description={isEditMode ? "Edit form" : "Create form"} />
          <Stepper.Step label="Pages" description="Add pages" />
          <Stepper.Step label="Fields" description="Add fields" disabled={pages.length === 0} />
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
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Title order={4} mb="md">{isEditMode ? 'Edit Form' : 'Create Form'}</Title>
            <form onSubmit={handleCreateForm}>
              <Stack gap="sm">
                <TextInput
                  label="Form Title"
                  placeholder="e.g., Customer Feedback Survey"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.currentTarget.value)}
                  required
                  size="sm"
                />
                <Textarea
                  label="Description"
                  placeholder="Brief description of the form"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.currentTarget.value)}
                  rows={3}
                  size="sm"
                />
                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="sm"
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
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'sticky', top: 20 }}>
                <Stack gap="md">
                  <Title order={4}>Pages ({pages.length})</Title>
                  <Divider />
                  {pages.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      No pages added yet
                    </Text>
                  ) : (
                    <ScrollArea h={600}>
                      <Stack gap="xs">
                        {pages.map((page, index) => (
                          <Paper 
                            key={page.id} 
                            p="sm" 
                            withBorder
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
                              e.currentTarget.style.borderColor = 'var(--mantine-color-indigo-4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.borderColor = 'var(--mantine-color-gray-4)'
                            }}
                          >
                            <Group gap="xs" wrap="nowrap">
                              {page.is_first ? (
                                <IconPlayerPlay size={16} style={{ color: 'var(--mantine-color-gray-6)', fill: 'var(--mantine-color-gray-6)' }} />
                              ) : (
                                <Stack gap={2}>
                                  <ActionIcon
                                    color="gray"
                                    variant="light"
                                    onClick={() => handleMovePage(page.id, 'up')}
                                    disabled={index === 1 || loading || pages[index - 1]?.is_first}
                                    size="xs"
                                    title="Move up"
                                  >
                                    <IconArrowUp size={12} />
                                  </ActionIcon>
                                  <ActionIcon
                                    color="gray"
                                    variant="light"
                                    onClick={() => handleMovePage(page.id, 'down')}
                                    disabled={index === pages.length - 1 || loading}
                                    size="xs"
                                    title="Move down"
                                  >
                                    <IconArrowDown size={12} />
                                  </ActionIcon>
                                </Stack>
                              )}
                              <div 
                                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                onClick={() => handlePageSelect(page)}
                              >
                                <Text fw={500} size="sm" truncate>{page.title}</Text>
                                {page.description && (
                                  <Text size="xs" c="dimmed" truncate mt={2}>{page.description}</Text>
                                )}
                              </div>
                              <Group gap={2}>
                                {!page.is_first && (
                                  <ActionIcon
                                    color="indigo"
                                    variant="light"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSetAsFirstPage(page.id)
                                    }}
                                    disabled={loading}
                                    size="sm"
                                    title="Set as First Page"
                                  >
                                    <IconPin size={14} />
                                  </ActionIcon>
                                )}
                                <ActionIcon
                                  color="purple"
                                  variant="light"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenNavigationRules(page)
                                  }}
                                  disabled={loading}
                                  size="sm"
                                  title="Configure Navigation Rules"
                                >
                                  <IconRoute size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  color="blue"
                                  variant="light"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePageSelect(page)
                                  }}
                                  size="sm"
                                  title="Add/Edit Fields"
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  color="red"
                                  variant="light"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePage(page)
                                  }}
                                  disabled={loading}
                                  size="sm"
                                  title="Delete Page"
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </ScrollArea>
                  )}
                  {currentForm && pages.length > 0 && (
                    <>
                      <Divider mt="md" />
                      <Button
                        fullWidth
                        size="sm"
                        variant="gradient"
                        gradient={{ from: 'green', to: 'teal', deg: 90 }}
                        leftSection={<IconCheck size={16} />}
                        onClick={handleFinish}
                      >
                        Finish Form
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Title order={4} mb="md">Add Pages to "{currentForm.title}"</Title>
                <form onSubmit={handleCreatePage}>
                  <Stack gap="sm">
                    <TextInput
                      label="Page Title"
                      placeholder="e.g., Basic Information"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.currentTarget.value)}
                      required
                      size="sm"
                    />
                    <Textarea
                      label="Description"
                      placeholder="Page description"
                      value={pageDescription}
                      onChange={(e) => setPageDescription(e.currentTarget.value)}
                      rows={2}
                      size="sm"
                    />
                    <Checkbox
                      label="Mark as first page"
                      description={pages.some(p => p.is_first) ? "Note: This will unmark the current first page" : "This will be the starting page of the form"}
                      checked={isFirstPage}
                      onChange={(e) => setIsFirstPage(e.currentTarget.checked)}
                      size="sm"
                    />
                    <Button
                      type="submit"
                      loading={loading}
                      leftSection={<IconPlus size={16} />}
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                      fullWidth
                      size="sm"
                    >
                      Add Page
                    </Button>
                  </Stack>
                </form>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* Step 3: Create Fields */}
        {activeStep === 2 && currentForm && (
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group mb="md">
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setActiveStep(1)
                  setCurrentPage(null)
                  setFields([])
                }}
                leftSection={<IconArrowLeft size={16} />}
              >
                Back to Pages
              </Button>
            </Group>
            {pages.length === 0 ? (
              <Stack gap="sm" align="center" py="md">
                <Alert icon={<IconAlertCircle size={18} />} title="No Pages Available" color="yellow" size="sm">
                  You need to create at least one page before adding fields.
                </Alert>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setActiveStep(1)}
                  leftSection={<IconArrowLeft size={16} />}
                >
                  Go Back to Add Pages
                </Button>
              </Stack>
            ) : !currentPage ? (
              <Stack gap="sm">
                <Alert icon={<IconAlertCircle size={18} />} title="Select a Page" color="blue" size="sm">
                  Please select a page to add fields to.
                </Alert>
                <Select
                  label="Select Page"
                  placeholder="Choose a page"
                  value={null}
                  onChange={(val) => {
                    const page = pages.find((p) => p.id === parseInt(val || '0'))
                    if (page) {
                      handlePageSelect(page)
                    }
                  }}
                  data={pages.map((page) => ({
                    value: page.id.toString(),
                    label: page.title + (page.is_first ? ' (First Page)' : ''),
                  }))}
                  size="sm"
                />
              </Stack>
            ) : (
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'sticky', top: 20 }}>
                    <Stack gap="md">
                      <Title order={4}>Fields ({fields.length})</Title>
                      <Divider />
                      {fields.length === 0 ? (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                          No fields added yet
                        </Text>
                      ) : (
                        <ScrollArea h={600}>
                          <Stack gap="xs">
                            {fields.map((field, index) => (
                              <Paper 
                                key={field.id} 
                                p="sm" 
                                withBorder
                                style={{ 
                                  borderColor: editingFieldId === field.id ? 'var(--mantine-color-indigo-6)' : undefined,
                                  borderWidth: editingFieldId === field.id ? 2 : undefined,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
                                  e.currentTarget.style.borderColor = editingFieldId === field.id ? 'var(--mantine-color-indigo-6)' : 'var(--mantine-color-indigo-4)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.borderColor = editingFieldId === field.id ? 'var(--mantine-color-indigo-6)' : 'var(--mantine-color-gray-4)'
                                }}
                                onClick={() => handleEditField(field)}
                              >
                                <Group gap="xs" wrap="nowrap">
                                  <Stack gap={2}>
                                    <ActionIcon
                                      color="gray"
                                      variant="light"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMoveField(field.id, 'up')
                                      }}
                                      disabled={index === 0 || loading}
                                      size="xs"
                                    >
                                      <IconArrowUp size={12} />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="gray"
                                      variant="light"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMoveField(field.id, 'down')
                                      }}
                                      disabled={index === fields.length - 1 || loading}
                                      size="xs"
                                    >
                                      <IconArrowDown size={12} />
                                    </ActionIcon>
                                  </Stack>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text fw={500} size="sm" truncate>{field.label}</Text>
                                    <Group gap={4} mt={4}>
                                      <Badge variant="light" size="xs">{field.field_type}</Badge>
                                      {field.is_required && (
                                        <Badge color="red" variant="light" size="xs">Required</Badge>
                                      )}
                                    </Group>
                                  </div>
                                  <Group gap={2}>
                                    <ActionIcon
                                      color="orange"
                                      variant="light"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenFieldConditions(field)
                                      }}
                                      disabled={loading}
                                      size="sm"
                                      title="Configure Field Conditions"
                                    >
                                      <IconFilter size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="blue"
                                      variant="light"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditField(field)
                                      }}
                                      disabled={editingFieldId === field.id}
                                      size="sm"
                                    >
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="red"
                                      variant="light"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteField(field)
                                      }}
                                      disabled={loading}
                                      size="sm"
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Group>
                                </Group>
                              </Paper>
                            ))}
                          </Stack>
                        </ScrollArea>
                      )}
                      {currentForm && pages.length > 0 && (
                        <>
                          <Divider mt="md" />
                          <Button
                            fullWidth
                            size="sm"
                            variant="gradient"
                            gradient={{ from: 'green', to: 'teal', deg: 90 }}
                            leftSection={<IconCheck size={16} />}
                            onClick={handleFinish}
                          >
                            Finish Form
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                  <form onSubmit={handleCreateField}>
                  <Stack gap="sm">
                    <Group grow>
                      <TextInput
                        label="Field Name"
                        placeholder="e.g., email, age"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.currentTarget.value)}
                        required
                        size="sm"
                        disabled={!currentPage}
                      />
                      <TextInput
                        label="Field Label"
                        placeholder="e.g., Email Address"
                        value={fieldLabel}
                        onChange={(e) => setFieldLabel(e.currentTarget.value)}
                        required
                        size="sm"
                        disabled={!currentPage}
                      />
                    </Group>
                    <Select
                      label="Field Type"
                      value={fieldType}
                      onChange={(val) => handleFieldTypeChange(val || 'text')}
                      data={FIELD_TYPES}
                      required
                      size="sm"
                      disabled={!currentPage}
                    />
                    <TextInput
                      label="Placeholder"
                      placeholder="Enter placeholder text"
                      value={fieldPlaceholder}
                      onChange={(e) => setFieldPlaceholder(e.currentTarget.value)}
                      size="sm"
                      disabled={!currentPage}
                    />
                    <TextInput
                      label="Help Text"
                      placeholder="Additional help text"
                      value={fieldHelpText}
                      onChange={(e) => setFieldHelpText(e.currentTarget.value)}
                      size="sm"
                      disabled={!currentPage}
                    />

                {/* Options UI for select/radio/checkbox */}
                {(fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && (
                  <Paper p="sm" withBorder>
                    <Text fw={500} size="sm" mb="sm">
                      Options <Text component="span" c="red">*</Text>
                    </Text>
                    {fieldChoices.length > 0 && (
                      <Stack gap="xs" mb="sm">
                        {fieldChoices.map((choice, index) => (
                          <Paper key={index} p="xs" withBorder>
                            <Group justify="space-between">
                              <div>
                                <Text fw={500} size="sm">{choice.label}</Text>
                                <Text size="xs" c="dimmed">value: {choice.value}</Text>
                              </div>
                              <ActionIcon
                                color="red"
                                variant="light"
                                size="sm"
                                onClick={() => handleRemoveChoice(index)}
                              >
                                <IconTrash size={14} />
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
                      leftSection={<IconPlus size={14} />}
                      variant="light"
                      fullWidth
                      mt="xs"
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
                  <Paper p="sm" withBorder>
                    <Text fw={500} size="sm" mb="sm">Rating Range</Text>
                    <Group grow>
                      <NumberInput
                        label="Minimum"
                        value={ratingMin}
                        onChange={(val) => setRatingMin(Number(val) || 1)}
                        min={1}
                        size="sm"
                      />
                      <NumberInput
                        label="Maximum"
                        value={ratingMax}
                        onChange={(val) => setRatingMax(Number(val) || 5)}
                        min={ratingMin + 1}
                        size="sm"
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
                      disabled={!currentPage}
                      size="sm"
                    />

                    <Group>
                      <Button
                        type="submit"
                        loading={loading}
                        leftSection={editingFieldId ? <IconCheck size={16} /> : <IconPlus size={16} />}
                        variant="gradient"
                        gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                        disabled={!currentPage}
                        size="sm"
                      >
                        {editingFieldId ? 'Update Field' : 'Add Field'}
                      </Button>
                  {editingFieldId && (
                    <Button
                      variant="light"
                      onClick={handleCancelEdit}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="light"
                    onClick={() => {
                      setActiveStep(1)
                      setCurrentPage(null)
                      setFields([])
                    }}
                    leftSection={<IconArrowLeft size={16} />}
                    size="sm"
                  >
                    Back to Pages
                  </Button>
                </Group>
                  </Stack>
                  </form>
                  </Card>
                </Grid.Col>
              </Grid>
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

        {/* Preview Modal */}
        <Modal
          opened={previewModalOpened}
          onClose={closePreviewModal}
          title={`Preview: ${currentForm?.title || 'Form'}`}
          size="xl"
          centered
        >
          {currentForm && pages.length > 0 && (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                This is how your form will appear to users. Fields are shown in their current order.
              </Text>
              <Divider />
              {pages.map((page) => {
                // For preview, we'll show fields for the current page being edited
                // In a full implementation, you'd load fields for each page
                const pageFields = currentPage && currentPage.id === page.id 
                  ? fields.sort((a, b) => (a.order || 0) - (b.order || 0))
                  : [];
                
                return (
                  <Card key={page.id} shadow="sm" padding="md" radius="md" withBorder>
                    <Stack gap="md">
                      <div>
                        <Title order={3}>{page.title}</Title>
                        {page.description && (
                          <Text size="sm" c="dimmed" mt="xs">{page.description}</Text>
                        )}
                      </div>
                      <Stack gap="md">
                        {pageFields.length === 0 ? (
                          <Text size="sm" c="dimmed" ta="center" py="md">
                            No fields added to this page yet
                          </Text>
                        ) : (
                          pageFields.map((field) => (
                            <div key={field.id}>
                              <Text fw={500} size="sm" mb="xs">
                                {field.label}
                                {field.is_required && <Text component="span" c="red"> *</Text>}
                              </Text>
                              {field.help_text && (
                                <Text size="xs" c="dimmed" mb="xs">{field.help_text}</Text>
                              )}
                              {(() => {
                                switch (field.field_type) {
                                  case 'text':
                                  case 'email':
                                  case 'phone':
                                    return <TextInput placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} disabled size="sm" />;
                                  case 'textarea':
                                    return <Textarea placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} disabled rows={3} size="sm" />;
                                  case 'number':
                                    return <NumberInput placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} disabled size="sm" />;
                                  case 'select':
                                    return (
                                      <Select
                                        placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
                                        data={field.options?.choices?.map((c: any) => c.label) || []}
                                        disabled
                                        size="sm"
                                      />
                                    );
                                  case 'radio':
                                    return (
                                      <Radio.Group>
                                        <Stack gap="xs">
                                          {field.options?.choices?.map((choice: any, idx: number) => (
                                            <Radio key={idx} label={choice.label} value={choice.value} disabled />
                                          ))}
                                        </Stack>
                                      </Radio.Group>
                                    );
                                  case 'checkbox':
                                    return (
                                      <Checkbox.Group>
                                        <Stack gap="xs">
                                          {field.options?.choices?.map((choice: any, idx: number) => (
                                            <Checkbox key={idx} label={choice.label} value={choice.value} disabled />
                                          ))}
                                        </Stack>
                                      </Checkbox.Group>
                                    );
                                  case 'boolean':
                                    return <Switch label={field.label} disabled />;
                                  case 'rating':
                                    return (
                                      <Rating
                                        value={0}
                                        count={field.options?.max || 5}
                                        readOnly
                                      />
                                    );
                                  default:
                                    return <TextInput placeholder={field.placeholder} disabled size="sm" />;
                                }
                              })()}
                            </div>
                          ))
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
              <Group justify="flex-end" mt="md">
                <Button onClick={closePreviewModal}>Close Preview</Button>
                {currentForm && (
                  <Button
                    component={Link}
                    to={`/form/${currentForm.id}`}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                  >
                    View Live Form
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Navigation Rules Modal */}
        <Modal
          opened={navigationRulesModalOpened}
          onClose={() => {
            closeNavigationRulesModal()
            setSelectedPageForRules(null)
            setNavigationRules([])
            setRuleSourceFieldId('')
            setRuleOperator('equals')
            setRuleValue('')
            setRuleTargetPageId('')
            setRuleIsDefault(false)
            setEditingRuleId(null)
          }}
          title={`Navigation Rules: ${selectedPageForRules?.title || ''}`}
          size="xl"
          centered
        >
          {selectedPageForRules && (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Configure conditional navigation for this page. When a user completes this page, the form will navigate to different pages based on their answers.
              </Text>
              <Divider />
              
              {/* Existing Rules */}
              {navigationRules.length > 0 && (
                <Stack gap="sm">
                  <Title order={4}>Existing Rules</Title>
                  {navigationRules.map((rule) => (
                    <Paper key={rule.id} p="sm" withBorder>
                      <Group justify="space-between">
                        <div style={{ flex: 1 }}>
                          {rule.is_default ? (
                            <Text size="sm" fw={500}>Default: Go to {pages.find(p => p.id === rule.target_page_id)?.title || 'Unknown Page'}</Text>
                          ) : (
                            <Text size="sm">
                              If <strong>{fields.find(f => f.id === rule.source_field_id)?.label || 'Unknown Field'}</strong>{' '}
                              {rule.operator === 'equals' && 'equals'}
                              {rule.operator === 'not_equals' && 'does not equal'}
                              {rule.operator === 'contains' && 'contains'}
                              {rule.operator === 'greater_than' && 'is greater than'}
                              {rule.operator === 'less_than' && 'is less than'}
                              {rule.operator === 'is_empty' && 'is empty'}
                              {rule.operator === 'is_not_empty' && 'is not empty'}
                              {' '}
                              {rule.value && `"${rule.value}"`}
                              {' '}
                              → Go to <strong>{pages.find(p => p.id === rule.target_page_id)?.title || 'Unknown Page'}</strong>
                            </Text>
                          )}
                        </div>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDeleteNavigationRule(rule.id)}
                          disabled={loading}
                          size="sm"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              <Divider />

              {/* Add New Rule Form */}
              <Title order={4}>Add New Rule</Title>
              <Stack gap="md">
                <Checkbox
                  label="Default Rule"
                  description="This rule will be used if no other rules match. Only one default rule per page."
                  checked={ruleIsDefault}
                  onChange={(e) => {
                    setRuleIsDefault(e.currentTarget.checked)
                    if (e.currentTarget.checked) {
                      setRuleSourceFieldId('')
                      setRuleOperator('equals')
                      setRuleValue('')
                    }
                  }}
                />

                {!ruleIsDefault && (
                  <>
                    <Select
                      label="Source Field"
                      description="Field on this page to check"
                      placeholder="Select a field"
                      value={ruleSourceFieldId}
                      onChange={(val) => setRuleSourceFieldId(val || '')}
                      data={fields.map(f => ({ value: f.id.toString(), label: f.label }))}
                      required={!ruleIsDefault}
                    />

                    <Select
                      label="Operator"
                      value={ruleOperator}
                      onChange={(val) => setRuleOperator(val || 'equals')}
                      data={[
                        { value: 'equals', label: 'Equals' },
                        { value: 'not_equals', label: 'Not Equals' },
                        { value: 'contains', label: 'Contains' },
                        { value: 'not_contains', label: 'Not Contains' },
                        { value: 'greater_than', label: 'Greater Than' },
                        { value: 'less_than', label: 'Less Than' },
                        { value: 'greater_equal', label: 'Greater or Equal' },
                        { value: 'less_equal', label: 'Less or Equal' },
                        { value: 'is_empty', label: 'Is Empty' },
                        { value: 'is_not_empty', label: 'Is Not Empty' },
                        { value: 'in', label: 'In (comma-separated)' },
                        { value: 'not_in', label: 'Not In (comma-separated)' },
                      ]}
                      required={!ruleIsDefault}
                    />

                    {ruleOperator !== 'is_empty' && ruleOperator !== 'is_not_empty' && (
                      <TextInput
                        label="Value"
                        placeholder="Enter value to compare"
                        value={ruleValue}
                        onChange={(e) => setRuleValue(e.currentTarget.value)}
                        required={!ruleIsDefault && ruleOperator !== 'is_empty' && ruleOperator !== 'is_not_empty'}
                      />
                    )}
                  </>
                )}

                <Select
                  label="Target Page"
                  description="Page to navigate to when condition is met"
                  placeholder="Select target page"
                  value={ruleTargetPageId}
                  onChange={(val) => setRuleTargetPageId(val || '')}
                  data={pages
                    .filter(p => p.id !== selectedPageForRules.id)
                    .map(p => ({ value: p.id.toString(), label: p.title }))}
                  required
                />

                <Button
                  onClick={handleCreateNavigationRule}
                  loading={loading}
                  leftSection={<IconPlus size={18} />}
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                  fullWidth
                >
                  Add Navigation Rule
                </Button>
              </Stack>
            </Stack>
          )}
        </Modal>

        {/* Field Conditions Modal */}
        <Modal
          opened={fieldConditionsModalOpened}
          onClose={() => {
            closeFieldConditionsModal()
            setSelectedFieldForConditions(null)
            setFieldConditions([])
            setConditionSourcePageId('')
            setConditionSourceFieldId('')
            setConditionOperator('equals')
            setConditionValue('')
            setConditionAction('show')
            setSourcePageFields([])
          }}
          title={`Field Conditions: ${selectedFieldForConditions?.label || ''}`}
          size="xl"
          centered
        >
          {selectedFieldForConditions && (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Configure conditions for this field. The field will be shown, hidden, enabled, disabled, required, or skipped based on the value of another field.
              </Text>
              <Divider />
              
              {/* Existing Conditions */}
              {fieldConditions.length > 0 && (
                <Stack gap="sm">
                  <Title order={4}>Existing Conditions</Title>
                  {fieldConditions.map((condition) => (
                    <Paper key={condition.id} p="sm" withBorder>
                      <Group justify="space-between">
                        <div style={{ flex: 1 }}>
                          <Text size="sm">
                            <strong>{condition.source_field?.label || 'Unknown Field'}</strong>{' '}
                            {condition.operator === 'equals' && 'equals'}
                            {condition.operator === 'not_equals' && 'does not equal'}
                            {condition.operator === 'contains' && 'contains'}
                            {condition.operator === 'not_contains' && 'does not contain'}
                            {condition.operator === 'greater_than' && 'is greater than'}
                            {condition.operator === 'less_than' && 'is less than'}
                            {condition.operator === 'is_empty' && 'is empty'}
                            {condition.operator === 'is_not_empty' && 'is not empty'}
                            {' '}
                            {condition.value && `"${condition.value}"`}
                            {' → '}
                            <strong>
                              {condition.action === 'show' && 'Show'}
                              {condition.action === 'hide' && 'Hide'}
                              {condition.action === 'enable' && 'Enable'}
                              {condition.action === 'disable' && 'Disable'}
                              {condition.action === 'require' && 'Require'}
                              {condition.action === 'skip' && 'Skip'}
                            </strong>
                            {' this field'}
                          </Text>
                        </div>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDeleteFieldCondition(condition.id)}
                          disabled={loading}
                          size="sm"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                  <Divider />
                </Stack>
              )}

              {/* Add New Condition */}
              <Title order={4}>Add New Condition</Title>
              <Stack gap="sm">
                <Select
                  label="Source Page"
                  description="Select the page containing the field to watch"
                  placeholder="Select page"
                  value={conditionSourcePageId}
                  onChange={handleConditionSourcePageChange}
                  data={pages.map(p => ({ value: p.id.toString(), label: p.title }))}
                  required
                  size="sm"
                />

                {conditionSourcePageId && sourcePageFields.length > 0 && (
                  <Select
                    label="Source Field"
                    description="Field whose value will trigger this condition"
                    placeholder="Select field"
                    value={conditionSourceFieldId}
                    onChange={(val) => setConditionSourceFieldId(val || '')}
                    data={sourcePageFields
                      .filter(f => f.id !== selectedFieldForConditions?.id) // Don't allow self-reference
                      .map(f => ({ value: f.id.toString(), label: f.label }))}
                    required
                    size="sm"
                  />
                )}

                {conditionSourcePageId && sourcePageFields.length === 0 && (
                  <Alert icon={<IconAlertCircle size={16} />} color="yellow" size="sm">
                    No fields available on this page. Please add fields to the selected page first.
                  </Alert>
                )}

                {conditionSourcePageId && (
                  <Select
                    label="Operator"
                    value={conditionOperator}
                    onChange={(val) => setConditionOperator(val || 'equals')}
                    data={[
                      { value: 'equals', label: 'Equals' },
                      { value: 'not_equals', label: 'Not Equals' },
                      { value: 'contains', label: 'Contains' },
                      { value: 'not_contains', label: 'Not Contains' },
                      { value: 'greater_than', label: 'Greater Than' },
                      { value: 'less_than', label: 'Less Than' },
                      { value: 'is_empty', label: 'Is Empty' },
                      { value: 'is_not_empty', label: 'Is Not Empty' },
                    ]}
                    required
                    size="sm"
                  />
                )}

                {conditionSourcePageId && conditionOperator !== 'is_empty' && conditionOperator !== 'is_not_empty' && (
                  <TextInput
                    label="Value"
                    placeholder="Enter value to compare"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.currentTarget.value)}
                    required={conditionOperator !== 'is_empty' && conditionOperator !== 'is_not_empty'}
                    size="sm"
                  />
                )}

                {conditionSourcePageId && (
                  <Select
                    label="Action"
                    description="What to do when condition is met"
                    value={conditionAction}
                    onChange={(val) => setConditionAction(val || 'show')}
                    data={[
                      { value: 'show', label: 'Show Field' },
                      { value: 'hide', label: 'Hide Field' },
                      { value: 'enable', label: 'Enable Field' },
                      { value: 'disable', label: 'Disable Field' },
                      { value: 'require', label: 'Require Field' },
                      { value: 'skip', label: 'Skip Field' },
                    ]}
                    required
                    size="sm"
                  />
                )}

                <Button
                  onClick={handleCreateFieldCondition}
                  disabled={!conditionSourcePageId || !conditionSourceFieldId || !conditionAction || loading}
                  leftSection={<IconPlus size={16} />}
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                  size="sm"
                >
                  Add Condition
                </Button>
              </Stack>
            </Stack>
          )}
        </Modal>

        {/* Delete Page Modal */}
        <Modal
          opened={deletePageModalOpened}
          onClose={closeDeletePageModal}
          title="Delete Page"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this page?
            </Text>
            {pageToDelete && (
              <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" fw={500} mb="xs">Page Details:</Text>
                <Text size="sm">{pageToDelete.title}</Text>
              </Paper>
            )}
            <Alert icon={<IconAlertCircle size={16} />} color="red" size="sm">
              <Text size="sm" fw={500} mb={4}>Warning:</Text>
              <Text size="sm">All fields in this page will also be deleted. This action cannot be undone.</Text>
            </Alert>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeletePageModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeletePageConfirm}
                loading={loading}
                leftSection={<IconTrash size={16} />}
              >
                Delete Page
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Field Modal */}
        <Modal
          opened={deleteFieldModalOpened}
          onClose={closeDeleteFieldModal}
          title="Delete Field"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this field?
            </Text>
            {fieldToDelete && (
              <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" fw={500} mb="xs">Field Details:</Text>
                <Text size="sm"><strong>Label:</strong> {fieldToDelete.label}</Text>
                <Text size="sm"><strong>Name:</strong> {fieldToDelete.name}</Text>
                <Text size="sm"><strong>Type:</strong> {fieldToDelete.field_type}</Text>
              </Paper>
            )}
            <Text size="sm" c="dimmed">
              This action cannot be undone.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeleteFieldModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteFieldConfirm}
                loading={loading}
                leftSection={<IconTrash size={16} />}
              >
                Delete Field
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Navigation Rule Modal */}
        <Modal
          opened={deleteRuleModalOpened}
          onClose={closeDeleteRuleModal}
          title="Delete Navigation Rule"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this navigation rule?
            </Text>
            <Text size="sm" c="dimmed">
              This action cannot be undone.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeleteRuleModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteNavigationRuleConfirm}
                loading={loading}
                leftSection={<IconTrash size={16} />}
              >
                Delete Rule
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Field Condition Modal */}
        <Modal
          opened={deleteConditionModalOpened}
          onClose={closeDeleteConditionModal}
          title="Delete Field Condition"
          centered
        >
          <Stack gap="md">
            <Text>
              Are you sure you want to delete this field condition?
            </Text>
            <Text size="sm" c="dimmed">
              This action cannot be undone.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={closeDeleteConditionModal}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteFieldConditionConfirm}
                loading={loading}
                leftSection={<IconTrash size={16} />}
              >
                Delete Condition
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}

export default FormBuilder
