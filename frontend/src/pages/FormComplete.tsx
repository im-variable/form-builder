import { Link, useParams } from 'react-router-dom'

function FormComplete() {
  const { formId } = useParams<{ formId: string }>()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
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
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all mb-3"
          >
            Back to Home
          </Link>
          {formId && (
            <Link
              to={`/form/${formId}`}
              className="block w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all"
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

