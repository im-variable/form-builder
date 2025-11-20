import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formAPI, FormRenderResponse, Field, SubmitAnswerRequest } from '../services/api'
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
      // Generate a simple UUID-like session ID
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)

      // Create submission
      await formAPI.createSubmission(id, newSessionId)

      // Render form
      const data = await formAPI.renderForm(id, newSessionId, {})
      setFormData(data)
      
      // Initialize answers from current values
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

      // Submit all visible fields on current page
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

      // Re-render form to get next page
      const updatedForm = await formAPI.renderForm(
        parseInt(formId!),
        sessionId,
        answers
      )

      if (updatedForm.is_complete) {
        // Form completed
        await formAPI.completeSubmission(sessionId)
        navigate(`/form/${formId}/complete`)
      } else if (updatedForm.next_page_id) {
        // Move to next page
        setFormData(updatedForm)
        setAnswers({}) // Clear answers for next page
      } else {
        // Stay on current page
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!formData) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(formData.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${formData.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {formData.form_title}
          </h1>
          {formData.current_page.description && (
            <p className="text-gray-600 mb-8">{formData.current_page.description}</p>
          )}

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {formData.current_page.title}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : formData.is_complete ? 'Complete' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormView

