import { TextInput, Textarea, NumberInput, Select, Radio, Checkbox, Switch, Rating, Stack, Text } from '@mantine/core'
import { Field } from '../services/api'

interface FieldRendererProps {
  field: Field
  value: any
  onChange: (value: any) => void
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextInput
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            size="md"
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
            size="md"
          />
        )

      case 'number':
        return (
          <NumberInput
            value={value || undefined}
            onChange={(val) => onChange(val)}
            placeholder={field.placeholder}
            required={field.is_required}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            size="md"
          />
        )

      case 'date':
        return (
          <TextInput
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            size="md"
          />
        )

      case 'datetime':
        return (
          <TextInput
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
            size="md"
          />
        )

      case 'select':
        return (
          <Select
            value={value || null}
            onChange={(val) => onChange(val)}
            placeholder="Select an option..."
            required={field.is_required}
            data={field.options?.choices?.map((choice: any) => ({
              value: choice.value,
              label: choice.label,
            })) || []}
            size="md"
          />
        )

      case 'radio':
        return (
          <Radio.Group
            value={value || ''}
            onChange={onChange}
            required={field.is_required}
          >
            <Stack gap="sm" mt="xs">
              {field.options?.choices?.map((choice: any) => (
                <Radio
                  key={choice.value}
                  value={choice.value}
                  label={choice.label}
                />
              ))}
            </Stack>
          </Radio.Group>
        )

      case 'checkbox':
        return (
          <Checkbox.Group
            value={Array.isArray(value) ? value : []}
            onChange={(vals) => onChange(vals)}
          >
            <Stack gap="sm" mt="xs">
              {field.options?.choices?.map((choice: any) => (
                <Checkbox
                  key={choice.value}
                  value={choice.value}
                  label={choice.label}
                />
              ))}
            </Stack>
          </Checkbox.Group>
        )

      case 'boolean':
        return (
          <Switch
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.currentTarget.checked)}
            label={value === true || value === 'true' ? 'Yes' : 'No'}
            size="md"
          />
        )

      case 'rating':
        const maxRating = field.options?.max || 5
        return (
          <Stack gap="xs">
            <Rating
              value={value || 0}
              onChange={onChange}
              count={maxRating}
              size="lg"
            />
            {value && (
              <Text size="sm" c="dimmed">
                {value} out of {maxRating} stars
              </Text>
            )}
          </Stack>
        )

      default:
        return (
          <TextInput
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            size="md"
          />
        )
    }
  }

  if (!field.is_visible) {
    return null
  }

  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        {field.label}
        {field.is_required && <Text component="span" c="red" fw={700}> *</Text>}
      </Text>
      {renderField()}
      {field.help_text && (
        <Text size="xs" c="dimmed" mt={4}>
          {field.help_text}
        </Text>
      )}
    </Stack>
  )
}

export default FieldRenderer
