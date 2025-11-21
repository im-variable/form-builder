import { Field } from '../services/api'

interface FieldRendererProps {
  field: Field
  value: any
  onChange: (value: any) => void
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : []
    if (checked) {
      onChange([...currentValues, optionValue])
    } else {
      onChange(currentValues.filter((v) => v !== optionValue))
    }
  }

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )

      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.is_required}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )

      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.is_required}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )

      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.is_required}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.is_required}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          >
            <option value="">Select an option...</option>
            {field.options?.choices?.map((choice: any) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.choices?.map((choice: any) => (
              <label 
                key={choice.value} 
                className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  value === choice.value
                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={field.name}
                  value={choice.value}
                  checked={value === choice.value}
                  onChange={handleChange}
                  required={field.is_required}
                  className="mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`font-medium ${value === choice.value ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {choice.label}
                </span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.choices?.map((choice: any) => {
              const isChecked = Array.isArray(value) && value.includes(choice.value)
              return (
                <label 
                  key={choice.value} 
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-500 shadow-md'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={choice.value}
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(choice.value, e.target.checked)}
                    className="mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className={`font-medium ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {choice.label}
                  </span>
                </label>
              )
            })}
          </div>
        )

      case 'boolean':
        const isChecked = value === true || value === 'true'
        return (
          <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all w-fit ${
            isChecked
              ? 'bg-indigo-50 border-indigo-500 shadow-md'
              : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className={`font-semibold ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>
              {isChecked ? 'Yes' : 'No'}
            </span>
          </label>
        )

      case 'rating':
        const maxRating = field.options?.max || 5
        return (
          <div className="flex items-center gap-3">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${
                  value >= rating
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-400 border-yellow-500 shadow-lg scale-110'
                    : 'bg-gray-100 border-gray-300 hover:border-yellow-300 hover:bg-yellow-50'
                } transform hover:scale-110 cursor-pointer`}
                title={`Rate ${rating} out of ${maxRating}`}
              >
                ⭐
              </button>
            ))}
            {value && (
              <span className="ml-4 text-lg font-semibold text-gray-700">
                {value} / {maxRating}
              </span>
            )}
          </div>
        )

      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        )
    }
  }

  if (!field.is_visible) {
    return null
  }

  return (
    <div className="field-group bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
      <label htmlFor={field.name} className="block text-sm font-semibold text-gray-900 mb-3">
        {field.label}
        {field.is_required && (
          <span className="ml-2 text-red-500 font-bold" title="Required field">*</span>
        )}
      </label>
      <div className="mb-2">
        {renderField()}
      </div>
      {field.help_text && (
        <p className="mt-2 text-sm text-gray-500 flex items-start gap-1">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {field.help_text}
        </p>
      )}
    </div>
  )
}

export default FieldRenderer

