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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          <div className="space-y-2">
            {field.options?.choices?.map((choice: any) => (
              <label key={choice.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={choice.value}
                  checked={value === choice.value}
                  onChange={handleChange}
                  required={field.is_required}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{choice.label}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice: any) => (
              <label key={choice.value} className="flex items-center">
                <input
                  type="checkbox"
                  value={choice.value}
                  checked={Array.isArray(value) && value.includes(choice.value)}
                  onChange={(e) => handleCheckboxChange(choice.value, e.target.checked)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">{choice.label}</span>
              </label>
            ))}
          </div>
        )

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-2 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Yes</span>
          </label>
        )

      case 'rating':
        const maxRating = field.options?.max || 5
        return (
          <div className="flex items-center space-x-2">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                className={`w-10 h-10 rounded-full border-2 ${
                  value >= rating
                    ? 'bg-yellow-400 border-yellow-500'
                    : 'bg-gray-100 border-gray-300'
                } hover:bg-yellow-300 transition-colors`}
              >
                ⭐
              </button>
            ))}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )
    }
  }

  if (!field.is_visible) {
    return null
  }

  return (
    <div className="field-group">
      <label htmlFor={field.name} className="field-label">
        {field.label}
        {field.is_required && <span className="field-required">*</span>}
      </label>
      {renderField()}
      {field.help_text && (
        <p className="field-help">{field.help_text}</p>
      )}
    </div>
  )
}

export default FieldRenderer

