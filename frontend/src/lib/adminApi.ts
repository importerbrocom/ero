import { api } from './api'

/** Admin API client — all endpoints require an admin/super_admin bearer token. */

export interface AdminOverview {
  students: { total: number; active: number; new_last_30_days: number }
  attempts: { total: number; completed: number; in_progress: number; average_accuracy: number }
  content: { programmes: number; questions: number; active_questions: number }
  programme_performance: { id: number; name: string; questions: number; attempts: number }[]
  recent_activity: { id: number; action: string; user: string | null; at: string }[]
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

export interface AdminStudent {
  id: number
  name: string
  email: string
  status: string
  country: string | null
  attempts_count: number
  created_at: string
}

export interface AdminQuestion {
  id: number
  stem: string
  difficulty: string
  status: string
  options_count: number
  subject?: { id: number; name: string } | null
  topic?: { id: number; name: string } | null
}

export interface ImportPreview {
  id: number
  filename: string
  status: string
  total_rows: number
  valid_rows: number
  error_rows: number
  errors: { row: number; messages: string[] }[]
  preview: {
    row: number
    valid: boolean
    stem: string
    subject: string | null
    correct: string | null
    options: string[]
    messages: string[]
  }[]
  stored_path: string
}

export interface AdminActivationCode {
  id: number
  code: string
  batch: string | null
  status: string
  multi_use: boolean
  max_redemptions: number
  redemption_count: number
  expires_at: string | null
  redemptions_count: number
  programme?: { id: number; name: string } | null
}

export interface AuditEntry {
  id: number
  action: string
  user?: { id: number; name: string; email: string } | null
  subject_type: string | null
  subject_id: number | null
  created_at: string
}

export const adminApi = {
  overview: () => api.get<{ data: AdminOverview }>('/admin/overview').then((r) => r.data.data),

  students: (params?: { search?: string; status?: string; page?: number }) =>
    api.get<Paginated<AdminStudent>>('/admin/students', { params }).then((r) => r.data),
  student: (id: number) => api.get(`/admin/students/${id}`).then((r) => r.data.data),
  setStudentStatus: (id: number, status: string) =>
    api.patch(`/admin/students/${id}/status`, { status }).then((r) => r.data),
  assignProgramme: (id: number, exam_programme_id: number, action: 'grant' | 'revoke') =>
    api.post(`/admin/students/${id}/programmes`, { exam_programme_id, action }).then((r) => r.data),

  questions: (params?: Record<string, unknown>) =>
    api.get<Paginated<AdminQuestion>>('/admin/questions', { params }).then((r) => r.data),
  question: (id: number) => api.get(`/admin/questions/${id}`).then((r) => r.data.data),
  createQuestion: (payload: unknown) => api.post('/admin/questions', payload).then((r) => r.data.data),
  updateQuestion: (id: number, payload: unknown) =>
    api.put(`/admin/questions/${id}`, payload).then((r) => r.data.data),
  archiveQuestion: (id: number) => api.delete(`/admin/questions/${id}`).then((r) => r.data),

  importPreview: (programmeId: number, file: File) => {
    const fd = new FormData()
    fd.append('exam_programme_id', String(programmeId))
    fd.append('file', file)
    return api
      .post<{ data: ImportPreview }>('/admin/imports/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data)
  },
  importCommit: (importId: number, storedPath: string) =>
    api.post(`/admin/imports/${importId}/commit`, { stored_path: storedPath }).then((r) => r.data),

  programmes: () => api.get('/admin/programmes').then((r) => r.data.data),
  createProgramme: (payload: Record<string, unknown>) =>
    api.post('/admin/programmes', payload).then((r) => r.data.data),
  updateProgramme: (id: number, payload: Record<string, unknown>) =>
    api.put(`/admin/programmes/${id}`, payload).then((r) => r.data.data),

  // Image upload → returns { path, url }
  uploadImage: (file: File, folder: 'programmes' | 'banners' | 'questions' | 'misc') => {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('folder', folder)
    return api
      .post<{ data: { path: string; url: string } }>('/admin/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data)
  },

  // Site settings (welcome banner, etc.)
  getSettings: () => api.get('/admin/settings').then((r) => r.data.data),
  updateSettings: (payload: Record<string, unknown>) =>
    api.put('/admin/settings', payload).then((r) => r.data.data),

  activationCodes: (params?: Record<string, unknown>) =>
    api.get<Paginated<AdminActivationCode>>('/admin/activation-codes', { params }).then((r) => r.data),
  generateCodes: (payload: {
    exam_programme_id?: number
    quantity: number
    multi_use?: boolean
    max_redemptions: number
    expires_at?: string
  }) => api.post('/admin/activation-codes', payload).then((r) => r.data.data),
  revokeCode: (id: number) => api.post(`/admin/activation-codes/${id}/revoke`).then((r) => r.data),

  auditLogs: (params?: Record<string, unknown>) =>
    api.get<Paginated<AuditEntry>>('/admin/audit-logs', { params }).then((r) => r.data),
}
