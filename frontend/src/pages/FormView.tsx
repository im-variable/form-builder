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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Progress
            </span>
            <span className="text-lg font-bold text-indigo-600">
              {Math.round(formData.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${formData.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-white/20">
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 rounded-xl p-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {formData.form_title}
                </h1>
                {formData.current_page.description && (
                  <p className="text-gray-600 mt-1">{formData.current_page.description}</p>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mt-4">
              {formData.current_page.title}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
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

            <div className="mt-10 flex justify-between gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    {formData.is_complete ? 'Complete' : 'Next'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormView

