import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  BookOpen,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { fetchPracticeDay, submitPracticeDay } from '../lib/queries'
import type { PracticeDay } from '../types'
import { Badge, Button, Card, ProgressRing } from '../components/ui'
import type { ApiError } from '../lib/api'

export default function PracticeDayRunner() {
  const { enrollmentId, day } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<PracticeDay | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPracticeDay(Number(enrollmentId), Number(day))
      .then((d) => {
        setData(d)
        // Pre-fill answers if the day was already completed (review mode).
        const pre: Record<number, number> = {}
        d.questions.forEach((q) => { if (q.selected_option_id) pre[q.question_id] = q.selected_option_id })
        setAnswers(pre)
      })
      .catch((e) => setError((e as ApiError).message))
  }, [enrollmentId, day])

  const completed = data?.status === 'completed'

  if (error) return <Card className="mx-auto max-w-xl"><p className="text-ero-danger">{error}</p></Card>
  if (!data) return <div className="flex h-64 items-center justify-center text-ero-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const q = data.questions[current]
  const answeredCount = Object.keys(answers).length

  const pick = (optionId: number) => {
    if (completed) return // review mode: locked
    setAnswers((a) => ({ ...a, [q.question_id]: optionId }))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitPracticeDay(Number(enrollmentId), data.id, answers)
      setData(res.data) // now completed, with reveal
      setCurrent(0)
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">
            Day {data.day_number} · Question {current + 1} of {data.questions.length}
          </div>
          {completed && (
            <div className="text-xs text-ero-success">Completed — reviewing answers</div>
          )}
        </div>
        {completed && data.accuracy !== null && <ProgressRing value={data.accuracy} size={52} />}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ero-bg-2">
        <div className="h-full rounded-full bg-ero-primary transition-all" style={{ width: `${((current + 1) / data.questions.length) * 100}%` }} />
      </div>

      <QuestionCard q={q} selectedId={answers[q.question_id] ?? null} completed={completed} onPick={pick} />

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="text-xs text-ero-muted">{answeredCount}/{data.questions.length} answered</div>
        {current < data.questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>Next <ArrowRight className="h-4 w-4" /></Button>
        ) : completed ? (
          <Button onClick={() => navigate(`/app/practice/${enrollmentId}`)}>Finish</Button>
        ) : (
          <Button variant="success" loading={submitting} onClick={submit}>Submit Day</Button>
        )}
      </div>

      {error && <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">{error}</div>}

      {/* Question palette */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {data.questions.map((item, i) => (
            <button
              key={item.question_id}
              onClick={() => setCurrent(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                i === current ? 'bg-ero-primary text-white'
                  : answers[item.question_id] != null ? 'bg-ero-success/20 text-ero-success'
                  : 'bg-ero-bg-2 text-ero-muted'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function QuestionCard({
  q,
  selectedId,
  completed,
  onPick,
}: {
  q: PracticeDay['questions'][number]
  selectedId: number | null
  completed: boolean
  onPick: (id: number) => void
}) {
  const correctId = useMemo(() => q.options.find((o) => o.is_correct)?.id ?? null, [q])
  const isCorrect = completed && selectedId != null && selectedId === correctId

  return (
    <Card className="space-y-4">
      {q.subject && <Badge>{q.subject}</Badge>}
      <p className="text-[15px] leading-relaxed">{q.stem}</p>
      {q.image_url && <img src={q.image_url} alt="" className="max-h-64 rounded-xl border border-ero-border" />}

      <div className="space-y-2.5">
        {q.options.map((opt) => {
          const selected = selectedId === opt.id
          // After completion, show correct (green) and the wrong pick (red).
          let cls = 'border-ero-border hover:border-ero-primary-400/60'
          if (completed) {
            if (opt.is_correct) cls = 'border-ero-success bg-ero-success/10'
            else if (selected) cls = 'border-ero-danger bg-ero-danger/10'
          } else if (selected) {
            cls = 'border-ero-primary bg-ero-primary/10'
          }
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              disabled={completed}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default ${cls}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                completed && opt.is_correct ? 'border-ero-success bg-ero-success text-white'
                  : selected ? 'border-ero-primary bg-ero-primary text-white'
                  : 'border-ero-border text-ero-muted'
              }`}>
                {opt.letter}
              </span>
              <span className="text-sm">{opt.text}</span>
              {completed && opt.is_correct && <CheckCircle2 className="ml-auto h-5 w-5 text-ero-success" />}
              {completed && selected && !opt.is_correct && <XCircle className="ml-auto h-5 w-5 text-ero-danger" />}
            </button>
          )
        })}
      </div>

      {/* Immediate feedback (screenshot 6) */}
      {completed && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
            isCorrect ? 'bg-ero-success/10 text-ero-success' : 'bg-ero-danger/10 text-ero-danger'
          }`}>
            {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {isCorrect ? 'Correct!' : selectedId == null ? 'Not answered' : 'Incorrect'}
          </div>

          {q.explanation && (
            <div className="rounded-xl bg-ero-bg-2 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ero-primary-400">
                <BookOpen className="h-4 w-4" /> Explanation
              </div>
              <p className="text-sm text-ero-muted">{q.explanation}</p>
            </div>
          )}
          {q.key_points && q.key_points.length > 0 && (
            <div className="rounded-xl bg-ero-bg-2 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ero-warning">
                <Lightbulb className="h-4 w-4" /> Key Points
              </div>
              <ul className="space-y-1 text-sm text-ero-muted">
                {q.key_points.map((kp, i) => <li key={i} className="flex gap-2"><span className="text-ero-primary-400">•</span>{kp}</li>)}
              </ul>
            </div>
          )}
          {q.high_yield_fact && (
            <div className="rounded-xl bg-ero-accent/10 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ero-accent">
                <Sparkles className="h-4 w-4" /> High-Yield Fact
              </div>
              <p className="text-sm text-ero-muted">{q.high_yield_fact}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
