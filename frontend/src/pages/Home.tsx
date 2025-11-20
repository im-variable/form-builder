import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dynamic Form Engine
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and fill out dynamic, multi-page forms with conditional logic
          </p>
          <Link
            to="/builder"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create New Form
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading forms...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Forms</h2>
            {forms.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No forms available yet.</p>
                <Link
                  to="/builder"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Create your first form →
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {forms.map((form) => (
                  <Link
                    key={form.id}
                    to={`/form/${form.id}`}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {form.title}
                    </h3>
                    {form.description && (
                      <p className="text-gray-600 mb-4">{form.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(form.created_at).toLocaleDateString()}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Start Form →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home

