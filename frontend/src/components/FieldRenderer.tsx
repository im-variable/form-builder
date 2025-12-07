import { TextInput, Textarea, NumberInput, Select, Radio, Checkbox, Switch, Rating, Stack, Text, FileButton, Button, Group, Image, Paper } from '@mantine/core'
import { IconUpload, IconX, IconPhoto, IconVideo, IconMusic } from '@tabler/icons-react'
import { useState } from 'react'
import { uploadAPI, Field } from '../services/api'

interface FieldRendererProps {
  field: Field
  value: any
  onChange: (value: any) => void
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File | null) => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // File field type always uses 'file' as the upload type
      const result = await uploadAPI.uploadFile('file', file)
      // Store the file URL in the value
      onChange(result.file_url)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file')
      console.error('File upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    onChange('')
    setError(null)
  }

  // Get attachment URL from field options
  const getAttachmentUrl = () => {
    const attachment = field.options?.attachment
    if (!attachment || !attachment.url) return null
    
    const attachmentUrl = attachment.url
    // If value is already a full URL, return it
    if (attachmentUrl.startsWith('http')) return attachmentUrl
    
    // Otherwise, construct the URL from the filename
    const parts = attachmentUrl.split('/')
    const filename = parts[parts.length - 1]
    const fileType = attachment.type || 'file'
    return uploadAPI.getFileUrl(fileType, filename)
  }

  // Render attachment display
  const renderAttachment = () => {
    const attachment = field.options?.attachment
    if (!attachment || !attachment.url) return null

    const attachmentUrl = getAttachmentUrl()
    if (!attachmentUrl) return null

    const attachmentType = attachment.type || 'file'

    return (
      <Paper p="sm" withBorder mb="md">
        <Group gap="xs" mb="xs">
          {attachmentType === 'image' && <IconPhoto size={20} />}
          {attachmentType === 'video' && <IconVideo size={20} />}
          {attachmentType === 'audio' && <IconMusic size={20} />}
          {(attachmentType === 'file' || !attachmentType) && <IconUpload size={20} />}
          <Text size="sm" fw={500}>Attachment</Text>
        </Group>
        {attachmentType === 'image' && (
          <Image
            src={attachmentUrl}
            alt={field.label}
            maw={400}
            mah={300}
            fit="contain"
            style={{ borderRadius: 4 }}
          />
        )}
        {attachmentType === 'video' && (
          <video
            src={attachmentUrl}
            controls
            style={{ width: '100%', maxWidth: 400, borderRadius: 4 }}
          />
        )}
        {attachmentType === 'audio' && (
          <audio
            src={attachmentUrl}
            controls
            style={{ width: '100%' }}
          />
        )}
        {(attachmentType === 'file' || !attachmentType) && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">File attachment</Text>
            <Button
              size="xs"
              variant="light"
              component="a"
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </Button>
          </Group>
        )}
      </Paper>
    )
  }

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
            value={value || null}
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

      case 'file':
        // For file field type, value is the uploaded file URL
        const fileUrl = value ? (value.startsWith('http') ? value : uploadAPI.getFileUrl('file', value.split('/').pop() || value)) : null
        return (
          <Stack gap="sm">
            {fileUrl ? (
              <Paper p="sm" withBorder>
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconUpload size={20} />
                    <Text size="sm" fw={500}>File uploaded</Text>
                  </Group>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      component="a"
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      leftSection={<IconX size={14} />}
                      onClick={handleRemoveFile}
                    >
                      Remove
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ) : (
              <FileButton onChange={handleFileUpload} disabled={uploading}>
                {(props) => (
                  <Button
                    {...props}
                    leftSection={<IconUpload size={18} />}
                    loading={uploading}
                    fullWidth
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                )}
              </FileButton>
            )}
            {error && (
              <Text size="xs" c="red">
                {error}
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
      {renderAttachment()}
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
