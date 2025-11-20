import { Link, useParams } from 'react-router-dom'

function FormComplete() {
  const { formId } = useParams<{ formId: string }>()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Form Completed!
          </h2>
          <p className="text-gray-600">
            Thank you for completing the form. Your responses have been saved.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
          {formId && (
            <Link
              to={`/form/${formId}`}
              className="block w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fill Again
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormComplete

