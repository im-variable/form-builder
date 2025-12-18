import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// File upload API (multipart/form-data)
const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

// Types
export interface Form {
  id: number
  title: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Page {
  id: number
  form_id: number
  title: string
  description?: string
  order?: number
  is_first: boolean
}

export interface FieldConditionRule {
  source_field_name: string
  operator: string
  value?: string
  action: string
}

export interface Field {
  id: number
  name: string
  label: string
  field_type: string
  placeholder?: string
  help_text?: string
  order?: number
  is_required: boolean
  is_visible: boolean
  default_value?: string
  options?: Record<string, any>
  validation_rules?: Record<string, any>
  current_value?: string
  conditions?: FieldConditionRule[]  // Conditions for frontend evaluation
  original_content?: string  // For paragraph fields: original content before processing
}

export interface RenderedPage {
  id: number
  title: string
  description?: string
  order: number
  is_first: boolean
  fields: Field[]
}

export interface FormRenderResponse {
  form_id: number
  form_title: string
  current_page: RenderedPage
  next_page_id?: number
  is_complete: boolean
  progress: number
}

export interface SubmitAnswerRequest {
  session_id: string
  field_id: number
  value?: string | number | boolean | string[]
}

export interface SubmitAnswerResponse {
  success: boolean
  next_page_id?: number
  is_complete: boolean
  message?: string
}

export interface SubmissionStatus {
  id: number
  form_id: number
  session_id: string
  status: string
  current_page_id?: number
  created_at: string
  updated_at?: string
}

// API Functions
export const formAPI = {
  // Get all forms
  getForms: async (): Promise<Form[]> => {
    const response = await api.get('/builder/forms')
    return response.data
  },

  // Get form by ID
  getForm: async (formId: number): Promise<Form> => {
    const response = await api.get(`/builder/forms/${formId}`)
    return response.data
  },

  // Render form (get current page)
  renderForm: async (
    formId: number,
    sessionId: string,
    currentAnswers?: Record<string, any>
  ): Promise<FormRenderResponse> => {
    const payload: any = {
      form_id: formId,
      session_id: sessionId,
    }
    if (currentAnswers !== undefined) {
      payload.current_answers = currentAnswers
    }
    const response = await api.post('/renderer/render', payload)
    return response.data
  },

  // Create submission
  createSubmission: async (formId: number, sessionId?: string): Promise<SubmissionStatus> => {
    const response = await api.post('/submission/create', {
      form_id: formId,
      session_id: sessionId,
    })
    return response.data
  },

  // Submit answer
  submitAnswer: async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
    const response = await api.post('/submission/submit-answer', data)
    return response.data
  },

  // Get submission status
  getSubmission: async (sessionId: string): Promise<SubmissionStatus> => {
    const response = await api.get(`/submission/${sessionId}`)
    return response.data
  },

  // Get submission responses
  getSubmissionResponses: async (sessionId: string): Promise<Record<string, any>> => {
    const response = await api.get(`/submission/${sessionId}/responses`)
    return response.data
  },

  // Complete submission
  completeSubmission: async (sessionId: string): Promise<void> => {
    await api.post(`/submission/${sessionId}/complete`)
  },

  // Get all submissions for a form
  getFormSubmissions: async (formId: number): Promise<any> => {
    const response = await api.get(`/submission/form/${formId}/submissions`)
    return response.data
  },

  // Delete a submission
  deleteSubmission: async (submissionId: number): Promise<void> => {
    await api.delete(`/submission/${submissionId}/delete`)
  },

  // Render a specific page for a submission
  renderPageForSubmission: async (submissionId: number, pageId: number): Promise<FormRenderResponse> => {
    const response = await api.get(`/renderer/submission/${submissionId}/page/${pageId}`)
    return response.data
  },

  // Get previous page for a submission
  getPreviousPageForSubmission: async (submissionId: number): Promise<FormRenderResponse> => {
    const response = await api.get(`/renderer/submission/${submissionId}/previous-page`)
    return response.data
  },

  // Get next page for a submission
  getNextPageForSubmission: async (submissionId: number): Promise<FormRenderResponse> => {
    const response = await api.get(`/renderer/submission/${submissionId}/next-page`)
    return response.data
  },

}

// Builder API Functions
export const builderAPI = {
  // Forms
  getForm: async (formId: number): Promise<Form> => {
    const response = await api.get(`/builder/forms/${formId}`)
    return response.data
  },

  createForm: async (data: { title: string; description?: string; is_active?: boolean }): Promise<Form> => {
    const response = await api.post('/builder/forms', data)
    return response.data
  },

  updateForm: async (formId: number, data: Partial<Form>): Promise<Form> => {
    const response = await api.put(`/builder/forms/${formId}`, data)
    return response.data
  },

  deleteForm: async (formId: number): Promise<void> => {
    await api.delete(`/builder/forms/${formId}`)
  },

  // Pages
  createPage: async (data: {
    form_id: number
    title: string
    description?: string
    order: number
    is_first?: boolean
  }): Promise<Page> => {
    const response = await api.post('/builder/pages', data)
    return response.data
  },

  getPages: async (formId: number): Promise<Page[]> => {
    const response = await api.get(`/builder/forms/${formId}/pages`)
    return response.data
  },

  updatePage: async (pageId: number, data: Partial<Page>): Promise<Page> => {
    const response = await api.put(`/builder/pages/${pageId}`, data)
    return response.data
  },

  deletePage: async (pageId: number): Promise<void> => {
    await api.delete(`/builder/pages/${pageId}`)
  },

  // Fields
  createField: async (data: {
    page_id: number
    name: string
    label: string
    field_type: string
    placeholder?: string
    help_text?: string
    order: number
    is_required?: boolean
    is_visible?: boolean
    default_value?: string
    options?: Record<string, any>
    validation_rules?: Record<string, any>
  }): Promise<Field> => {
    const response = await api.post('/builder/fields', data)
    return response.data
  },

  getFields: async (pageId: number): Promise<Field[]> => {
    const response = await api.get(`/builder/pages/${pageId}/fields`)
    return response.data
  },

  updateField: async (fieldId: number, data: Partial<Field>): Promise<Field> => {
    const response = await api.put(`/builder/fields/${fieldId}`, data)
    return response.data
  },

  deleteField: async (fieldId: number): Promise<void> => {
    await api.delete(`/builder/fields/${fieldId}`)
  },

  // Field Conditions
  createFieldCondition: async (data: {
    source_field_id: number
    target_field_id: number
    operator: string
    value?: string
    action: string
  }): Promise<any> => {
    const response = await api.post('/builder/field-conditions', data)
    return response.data
  },

  getFieldConditions: async (fieldId: number): Promise<any[]> => {
    const response = await api.get(`/builder/fields/${fieldId}/conditions`)
    return response.data
  },

  updateFieldCondition: async (conditionId: number, data: {
    source_field_id: number
    target_field_id: number
    operator: string
    value?: string
    action: string
  }): Promise<any> => {
    const response = await api.put(`/builder/field-conditions/${conditionId}`, data)
    return response.data
  },

  deleteFieldCondition: async (conditionId: number): Promise<void> => {
    await api.delete(`/builder/field-conditions/${conditionId}`)
  },

  // Navigation Rules
  createNavigationRule: async (data: {
    page_id: number
    source_field_id?: number
    operator: string
    value?: string
    target_page_id?: number
    is_default?: boolean
  }): Promise<any> => {
    const response = await api.post('/builder/navigation-rules', data)
    return response.data
  },

  getNavigationRules: async (pageId: number): Promise<any[]> => {
    const response = await api.get(`/builder/pages/${pageId}/navigation-rules`)
    return response.data
  },

  deleteNavigationRule: async (ruleId: number): Promise<void> => {
    await api.delete(`/builder/navigation-rules/${ruleId}`)
  },
}

// File Upload API
export const uploadAPI = {
  uploadFile: async (fileType: 'image' | 'video' | 'audio' | 'file', file: File): Promise<{
    filename: string
    original_filename: string
    file_type: string
    file_size: number
    file_url: string
  }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await uploadApi.post(`/upload/${fileType}`, formData)
    return response.data
  },

  getFileUrl: (fileType: string, filename: string): string => {
    return `${API_BASE_URL}/upload/file/${fileType}/${filename}`
  },
}

export default api

