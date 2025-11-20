import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [step, setStep] = useState<BuilderStep>('form')
  const [currentForm, setCurrentForm] = useState<Form | null>(null)
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

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setError('Form title is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const form = await builderAPI.createForm({
        title: formTitle,
        description: formDescription || undefined,
        is_active: true,
      })
      setCurrentForm(form)
      setStep('pages')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create form')
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
      const updatedPages = [...pages, page]
      setPages(updatedPages)
      setCurrentPage(page)
      setPageTitle('')
      setPageDescription('')
      setIsFirstPage(false)
      setStep('fields')
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

  const handlePageSelect = async (page: Page) => {
    setCurrentPage(page)
    setStep('fields')
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
    // Reset options when changing field type
    if (newType !== 'select' && newType !== 'radio' && newType !== 'checkbox') {
      setFieldChoices([])
    }
    if (newType !== 'rating') {
      setRatingMin(1)
      setRatingMax(5)
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPage || !fieldName.trim() || !fieldLabel.trim()) {
      setError('Field name and label are required')
      return
    }

    // Validate options for select/radio/checkbox
    if ((fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && fieldChoices.length === 0) {
      setError('Please add at least one option')
      return
    }

    // Validate rating range
    if (fieldType === 'rating' && ratingMin >= ratingMax) {
      setError('Rating minimum must be less than maximum')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let parsedOptions: Record<string, any> | undefined

      // Build options based on field type
      if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
        parsedOptions = {
          choices: fieldChoices,
        }
      } else if (fieldType === 'rating') {
        parsedOptions = {
          min: ratingMin,
          max: ratingMax,
        }
      }

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
      
      // Reset field form
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create field')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (currentForm) {
      navigate(`/form/${currentForm.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600 mt-2">Create dynamic forms with conditional logic</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['form', 'pages', 'fields', 'complete'].map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step === s
                      ? 'bg-indigo-600 text-white'
                      : idx < ['form', 'pages', 'fields', 'complete'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      idx < ['form', 'pages', 'fields', 'complete'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Form</span>
            <span>Pages</span>
            <span>Fields</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Create Form */}
        {step === 'form' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create Form</h2>
            <form onSubmit={handleCreateForm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Customer Feedback Survey"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the form"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Create Pages */}
        {step === 'pages' && currentForm && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Add Pages to "{currentForm.title}"
            </h2>
            <form onSubmit={handleCreatePage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Basic Information"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={pageDescription}
                    onChange={(e) => setPageDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={2}
                    placeholder="Page description"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFirst"
                    checked={isFirstPage}
                    onChange={(e) => setIsFirstPage(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isFirst" className="text-sm text-gray-700">
                    Mark as first page
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Page'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('fields')}
                    disabled={pages.length === 0}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Add Fields
                  </button>
                </div>
              </div>
            </form>
            {pages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Pages Created:</h3>
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{page.title}</span>
                        {page.is_first && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                            First
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePageSelect(page)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm"
                      >
                        Add Fields →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Create Fields */}
        {step === 'fields' && currentPage && currentForm && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Add Fields to "{currentPage.title}"
              </h2>
              {pages.length > 1 && (
                <select
                  value={currentPage.id}
                  onChange={(e) => {
                    const page = pages.find((p) => p.id === parseInt(e.target.value))
                    if (page) handlePageSelect(page)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <form onSubmit={handleCreateField}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., email, age"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fieldLabel}
                      onChange={(e) => setFieldLabel(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Email Address"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => handleFieldTypeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter placeholder text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Help Text
                  </label>
                  <input
                    type="text"
                    value={fieldHelpText}
                    onChange={(e) => setFieldHelpText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Additional help text"
                  />
                </div>
                {/* Options UI for select/radio/checkbox */}
                {(fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Options <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Existing choices */}
                    {fieldChoices.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {fieldChoices.map((choice, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {choice.label}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                (value: {choice.value})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChoice(index)}
                              className="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new choice */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newChoiceValue}
                          onChange={(e) => setNewChoiceValue(e.target.value)}
                          placeholder="Value (e.g., option1)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddChoice()
                            }
                          }}
                        />
                        <input
                          type="text"
                          value={newChoiceLabel}
                          onChange={(e) => setNewChoiceLabel(e.target.value)}
                          placeholder="Label (e.g., Option 1)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddChoice()
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChoice}
                        disabled={!newChoiceValue.trim() || !newChoiceLabel.trim()}
                        className="w-full bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                    {fieldChoices.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Add at least one option for this field type
                      </p>
                    )}
                  </div>
                )}

                {/* Rating configuration */}
                {fieldType === 'rating' && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Rating Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Minimum
                        </label>
                        <input
                          type="number"
                          value={ratingMin}
                          onChange={(e) => setRatingMin(parseInt(e.target.value) || 1)}
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Maximum
                        </label>
                        <input
                          type="number"
                          value={ratingMax}
                          onChange={(e) => setRatingMax(parseInt(e.target.value) || 5)}
                          min={ratingMin + 1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Rating will be from {ratingMin} to {ratingMax} stars
                    </p>
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="fieldRequired" className="text-sm text-gray-700">
                    Required field
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Field'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('pages')}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Add More Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('complete')
                      setCurrentPage(null)
                    }}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Finish
                  </button>
                </div>
              </div>
            </form>
            {fields.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fields Added:</h3>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{field.label}</span>
                        <span className="ml-2 text-xs text-gray-500">({field.field_type})</span>
                        {field.is_required && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && currentForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Created!</h2>
              <p className="text-gray-600 mb-6">
                Your form "{currentForm.title}" has been created successfully.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleFinish}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                View Form
              </button>
              <Link
                to="/builder"
                className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
              >
                Create Another Form
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FormBuilder
