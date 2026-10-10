import { api } from './api'
import type {
  Attempt,
  ExamQuestion,
  Programme,
  ProgrammeDetail,
} from '../types'

export async function fetchProgrammes(): Promise<Programme[]> {
  const { data } = await api.get('/programmes')
  return data.data
}

export async function fetchProgramme(slug: string): Promise<ProgrammeDetail> {
  const { data } = await api.get(`/programmes/${slug}`)
  return data.data
}

export async function redeemCode(code: string): Promise<{ message: string }> {
  const { data } = await api.post('/activation/redeem', { code })
  return data
}

export async function startAttempt(examId: number): Promise<Attempt> {
  const { data } = await api.post(`/exams/${examId}/attempts`)
  return data.data
}

export async function fetchAttempt(attemptId: number): Promise<Attempt> {
  const { data } = await api.get(`/attempts/${attemptId}`)
  return data.data
}

export async function startBlock(attemptId: number, blockId: number) {
  const { data } = await api.post(`/attempts/${attemptId}/blocks/${blockId}/start`)
  return data.data
}

export async function fetchBlockQuestions(
  attemptId: number,
  blockId: number,
): Promise<{ block: unknown; questions: ExamQuestion[] }> {
  const { data } = await api.get(
    `/attempts/${attemptId}/blocks/${blockId}/questions`,
  )
  return data.data
}

export async function saveAnswer(
  attemptId: number,
  blockId: number,
  payload: {
    attempt_question_id: number
    selected_option_id: number | null
    flagged: boolean
  },
) {
  const { data } = await api.post(
    `/attempts/${attemptId}/blocks/${blockId}/answer`,
    payload,
  )
  return data.data
}

export async function submitBlock(
  attemptId: number,
  blockId: number,
): Promise<Attempt> {
  const { data } = await api.post(
    `/attempts/${attemptId}/blocks/${blockId}/submit`,
  )
  return data.data
}

// ---- Phase 3: analytics + daily practice ----
import type {
  AnalyticsOverview,
  AttemptHistoryItem,
  PracticeDay,
  PracticePlan,
} from '../types'

export async function fetchAnalytics(programmeId?: number): Promise<AnalyticsOverview> {
  const { data } = await api.get('/analytics/overview', {
    params: programmeId ? { programme_id: programmeId } : undefined,
  })
  return data.data
}

export async function fetchAttemptHistory(): Promise<{
  data: AttemptHistoryItem[]
  meta: { current_page: number; last_page: number; total: number }
}> {
  const { data } = await api.get('/analytics/attempts')
  return data
}

export async function enrollPractice(examId: number): Promise<PracticePlan> {
  const { data } = await api.post(`/exams/${examId}/practice/enroll`)
  return data.data
}

export async function fetchPracticePlan(enrollmentId: number): Promise<PracticePlan> {
  const { data } = await api.get(`/practice/${enrollmentId}`)
  return data.data
}

export async function fetchPracticeDay(enrollmentId: number, day: number): Promise<PracticeDay> {
  const { data } = await api.get(`/practice/${enrollmentId}/days/${day}`)
  return data.data
}

export async function submitPracticeDay(
  enrollmentId: number,
  dayId: number,
  responses: Record<number, number>,
): Promise<{ data: PracticeDay; enrollment: PracticePlan }> {
  const { data } = await api.post(`/practice/${enrollmentId}/days/${dayId}/submit`, { responses })
  return data
}

// ---- Phase 6: FMGE level ladder ----
import type { LevelLadder } from '../types'

export async function fetchLevelLadder(slug: string): Promise<LevelLadder> {
  const { data } = await api.get(`/programmes/${slug}/levels`)
  return data.data
}
