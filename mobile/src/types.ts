// Shared API contract types — mirror the backend resources (same shapes the
// web app consumes in frontend/src/types.ts).

export type Role = 'student' | 'admin' | 'super_admin'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  country: string | null
  avatar_url: string | null
}

export interface Programme {
  id: number
  slug: string
  name: string
  full_name: string
  country: string | null
  flag_emoji: string | null
  description: string | null
  accent_color: string
  cover_image_url: string | null
  question_count: number
  has_access: boolean
}

export interface Subject {
  id: number
  name: string
  slug: string
  icon: string | null
  color: string | null
  question_count: number
}

export interface ExamSummary {
  id: number
  type: 'full_mock' | 'level_mock' | 'daily_practice' | 'subject_test'
  title: string
  description: string | null
  block_count: number
  questions_per_block: number
  total_questions: number
  block_duration_minutes: number
  plan_days: number | null
  questions_per_day: number | null
  timer_enabled: boolean
}

export interface ProgrammeDetail extends Programme {
  config: Record<string, unknown>
  subjects: Subject[]
  exams: ExamSummary[]
}

export type BlockStatus = 'locked' | 'available' | 'in_progress' | 'submitted' | 'expired'

export interface AttemptBlock {
  id: number
  display_position: number
  logical_number: number
  status: BlockStatus
  available_at: string | null
  started_at: string | null
  deadline_at: string | null
  submitted_at: string | null
  auto_submitted: boolean
  seconds_remaining: number | null
  seconds_until_available: number | null
  answered_count: number
  question_count: number
  server_time: string
}

export interface AttemptResult {
  total_questions: number
  answered_count: number
  correct_count: number
  incorrect_count: number
  accuracy: number | string
  subject_breakdown: Record<string, { total: number; correct: number }> | null
  topic_breakdown: Record<string, { total: number; correct: number }> | null
}

export interface Attempt {
  id: number
  exam_id: number
  status: 'in_progress' | 'completed' | 'expired' | 'abandoned'
  attempt_number: number
  started_at: string | null
  completed_at: string | null
  server_time: string
  exam: {
    title: string
    block_count: number
    questions_per_block: number
    block_duration_minutes: number
    block_release_interval_minutes: number
    block_release_mode: string
    allow_flagging: boolean
    result_visibility: string
  }
  blocks: AttemptBlock[]
  result: AttemptResult | null
}

export interface ExamOption {
  id: number
  letter: string
  text: string
  is_correct?: boolean
}

export interface ExamQuestion {
  attempt_question_id: number
  display_position: number
  stem: string
  image_url: string | null
  subject: string | null
  topic: string | null
  difficulty: string
  options: ExamOption[]
  selected_option_id: number | null
  is_flagged: boolean
  is_correct?: boolean
  explanation?: string
  key_points?: string[]
  high_yield_fact?: string
}

export interface AnalyticsOverview {
  overall_accuracy: number
  questions_attempted: number
  questions_total: number
  correct: number
  incorrect: number
  mock_attempts: number
  current_streak: number
  best_streak: number
  days_completed: number
  subject_accuracy: { subject: string; total: number; correct: number; accuracy: number }[]
  topic_accuracy: { topic: string; total: number; correct: number; accuracy: number }[]
  accuracy_trend: { label: string; date: string; accuracy: number; kind: string; title: string }[]
  mock_scores: { title: string; accuracy: number; completed_at: string | null }[]
  has_activity: boolean
}

export type PracticeDayStatus = 'locked' | 'available' | 'pending' | 'completed'

export interface PracticePlan {
  enrollment_id: number
  exam_id: number
  title: string
  plan_days: number
  questions_per_day: number
  timer_enabled: boolean
  allow_retry: boolean
  current_day: number
  streak: number
  best_streak: number
  last_completed_date: string | null
  completed_days: number
  schedule: {
    day_number: number
    status: PracticeDayStatus
    accuracy: number | null
    correct_count: number | null
    answered_count: number | null
    completed_at: string | null
  }[]
}

export interface PracticeQuestion {
  question_id: number
  display_position: number
  stem: string
  image_url: string | null
  subject: string | null
  topic: string | null
  difficulty: string
  options: ExamOption[]
  selected_option_id: number | null
  explanation?: string
  key_points?: string[]
  high_yield_fact?: string
}

export interface PracticeDay {
  id: number
  day_number: number
  status: 'pending' | 'completed'
  timer_enabled: boolean
  correct_count: number | null
  answered_count: number | null
  accuracy: number | null
  questions: PracticeQuestion[]
}

export interface AttemptHistoryItem {
  id: number
  exam_title: string
  exam_type: string
  programme: string | null
  flag_emoji: string | null
  status: string
  accuracy: number | null
  correct_count: number
  total_questions: number
  started_at: string | null
  completed_at: string | null
}
