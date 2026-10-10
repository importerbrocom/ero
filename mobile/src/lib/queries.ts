import { api } from './api'
import type {
  AnalyticsOverview,
  Attempt,
  AttemptHistoryItem,
  ExamQuestion,
  LevelLadder,
  PracticeDay,
  PracticePlan,
  Programme,
  ProgrammeDetail,
} from '../types'

// --- Programmes ---
export const fetchProgrammes = () =>
  api.get<{ data: Programme[] }>('/programmes').then((r) => r.data.data)

export const fetchProgramme = (slug: string) =>
  api.get<{ data: ProgrammeDetail }>(`/programmes/${slug}`).then((r) => r.data.data)

export const redeemCode = (code: string) =>
  api.post<{ message: string }>('/activation/redeem', { code }).then((r) => r.data)

// --- Mock exam engine ---
export const startAttempt = (examId: number) =>
  api.post<{ data: Attempt }>(`/exams/${examId}/attempts`).then((r) => r.data.data)

export const fetchAttempt = (attemptId: number) =>
  api.get<{ data: Attempt }>(`/attempts/${attemptId}`).then((r) => r.data.data)

export const startBlock = (attemptId: number, blockId: number) =>
  api.post(`/attempts/${attemptId}/blocks/${blockId}/start`).then((r) => r.data.data)

export const fetchBlockQuestions = (attemptId: number, blockId: number) =>
  api
    .get<{ data: { block: unknown; questions: ExamQuestion[] } }>(
      `/attempts/${attemptId}/blocks/${blockId}/questions`,
    )
    .then((r) => r.data.data)

export const saveAnswer = (
  attemptId: number,
  blockId: number,
  payload: { attempt_question_id: number; selected_option_id: number | null; flagged: boolean },
) => api.post(`/attempts/${attemptId}/blocks/${blockId}/answer`, payload).then((r) => r.data.data)

export const submitBlock = (attemptId: number, blockId: number) =>
  api
    .post<{ data: Attempt }>(`/attempts/${attemptId}/blocks/${blockId}/submit`)
    .then((r) => r.data.data)

// --- Daily practice ---
export const enrollPractice = (examId: number) =>
  api.post<{ data: PracticePlan }>(`/exams/${examId}/practice/enroll`).then((r) => r.data.data)

export const fetchPracticePlan = (enrollmentId: number) =>
  api.get<{ data: PracticePlan }>(`/practice/${enrollmentId}`).then((r) => r.data.data)

export const fetchPracticeDay = (enrollmentId: number, day: number) =>
  api.get<{ data: PracticeDay }>(`/practice/${enrollmentId}/days/${day}`).then((r) => r.data.data)

export const submitPracticeDay = (
  enrollmentId: number,
  dayId: number,
  responses: Record<number, number>,
) =>
  api
    .post<{ data: PracticeDay; enrollment: PracticePlan }>(
      `/practice/${enrollmentId}/days/${dayId}/submit`,
      { responses },
    )
    .then((r) => r.data)

// --- Analytics ---
export const fetchAnalytics = (programmeId?: number) =>
  api
    .get<{ data: AnalyticsOverview }>('/analytics/overview', {
      params: programmeId ? { programme_id: programmeId } : undefined,
    })
    .then((r) => r.data.data)

export const fetchAttemptHistory = () =>
  api
    .get<{ data: AttemptHistoryItem[]; meta: unknown }>('/analytics/attempts')
    .then((r) => r.data.data)

// --- FMGE level ladder ---
export const fetchLevelLadder = (slug: string) =>
  api.get<{ data: LevelLadder }>(`/programmes/${slug}/levels`).then((r) => r.data.data)
