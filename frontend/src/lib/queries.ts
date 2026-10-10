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
