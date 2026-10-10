import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Flag, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import {
  fetchAttempt,
  fetchBlockQuestions,
  saveAnswer,
  startBlock,
  submitBlock,
} from '../lib/queries'
import type { Attempt, AttemptBlock, ExamQuestion } from '../types'
import { Badge, Button, Card } from '../components/ui'
import { formatClock, useServerCountdown } from '../hooks/useServerCountdown'
import { AttemptResults } from '../components/AttemptResults'

export default function ExamRunner() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [activeBlock, setActiveBlock] = useState<AttemptBlock | null>(null)

  const refresh = useCallback(async () => {
    const a = await fetchAttempt(Number(attemptId))
    setAttempt(a)
    return a
  }, [attemptId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Poll the attempt state so scheduled block releases / auto-expiry surface
  // promptly (server remains the source of truth).
  useEffect(() => {
    if (activeBlock) return
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [activeBlock, refresh])

  if (!attempt) {
    return (
      <div className="flex h-64 items-center justify-center text-ero-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (attempt.status === 'completed' || attempt.status === 'expired') {
    return (
      <AttemptResults attempt={attempt} onDone={() => navigate('/app/tests')} />
    )
  }

  if (activeBlock) {
    return (
      <BlockInterface
        attempt={attempt}
        blockId={activeBlock.id}
        onExit={async () => {
          await refresh()
          setActiveBlock(null)
        }}
      />
    )
  }

  return (
    <BlockOverview
      attempt={attempt}
      onRefresh={refresh}
      onEnterBlock={async (block) => {
        await startBlock(attempt.id, block.id)
        setActiveBlock(block)
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Block overview — schedule, timers, release countdowns (§5.6/§5.7)   */
/* ------------------------------------------------------------------ */
function BlockOverview({
  attempt,
  onEnterBlock,
  onRefresh,
}: {
  attempt: Attempt
  onEnterBlock: (b: AttemptBlock) => Promise<void>
  onRefresh: () => Promise<Attempt>
}) {
  const [entering, setEntering] = useState<number | null>(null)

  const enter = async (b: AttemptBlock) => {
    setEntering(b.id)
    try {
      await onEnterBlock(b)
    } finally {
      setEntering(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{attempt.exam.title}</h1>
          <p className="text-sm text-ero-muted">
            {attempt.exam.block_count} blocks ·{' '}
            {attempt.exam.questions_per_block} questions each ·{' '}
            {attempt.exam.block_duration_minutes} min active per block
          </p>
        </div>
        <Button variant="ghost" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {attempt.blocks.map((b) => (
          <BlockRow key={b.id} block={b} entering={entering === b.id} onEnter={() => enter(b)} />
        ))}
      </div>
    </div>
  )
}

function BlockRow({
  block,
  onEnter,
  entering,
}: {
  block: AttemptBlock
  onEnter: () => void
  entering: boolean
}) {
  const releaseCountdown = useServerCountdown(block.seconds_until_available)
  const activeCountdown = useServerCountdown(block.seconds_remaining)

  const statusBadge = {
    locked: <Badge tone="locked"><Lock className="h-3 w-3" /> Locked</Badge>,
    available: <Badge tone="default">Available</Badge>,
    in_progress: <Badge tone="warning">In progress</Badge>,
    submitted: <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Submitted</Badge>,
    expired: <Badge tone="danger">Expired</Badge>,
  }[block.status]

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ero-bg-2 font-bold">
          {block.display_position}
        </div>
        <div>
          <div className="flex items-center gap-2 font-semibold">
            Block {block.display_position}
            {statusBadge}
          </div>
          <div className="text-xs text-ero-muted">
            {block.answered_count}/{block.question_count} answered
            {block.status === 'in_progress' && activeCountdown != null && (
              <span className="ml-2 inline-flex items-center gap-1 text-ero-warning">
                <Clock className="h-3 w-3" /> {formatClock(activeCountdown)} left
              </span>
            )}
            {block.status === 'locked' && releaseCountdown != null && releaseCountdown > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-ero-faint">
                <Clock className="h-3 w-3" /> unlocks in {formatClock(releaseCountdown)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        {(block.status === 'available' || block.status === 'in_progress') && (
          <Button onClick={onEnter} loading={entering}>
            {block.status === 'in_progress' ? 'Resume' : 'Start Block'}
          </Button>
        )}
        {block.status === 'locked' && (
          <Button variant="secondary" disabled>
            <Lock className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Block interface — one block, timer, question navigation (§5.5/§5.7)  */
/* ------------------------------------------------------------------ */
function BlockInterface({
  attempt,
  blockId,
  onExit,
}: {
  attempt: Attempt
  blockId: number
  onExit: () => void
}) {
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [block, setBlock] = useState<AttemptBlock | null>(null)
  const [current, setCurrent] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const load = useCallback(async () => {
    const data = await fetchBlockQuestions(attempt.id, blockId)
    setQuestions(data.questions)
    setBlock(data.block as AttemptBlock)
  }, [attempt.id, blockId])

  useEffect(() => {
    load()
  }, [load])

  const countdown = useServerCountdown(block?.seconds_remaining ?? null)

  const doSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return
      submittedRef.current = true
      setSubmitting(true)
      try {
        await submitBlock(attempt.id, blockId)
      } finally {
        if (!auto) setSubmitting(false)
        onExit()
      }
    },
    [attempt.id, blockId, onExit],
  )

  // Auto-submit when the local mirror of the server clock hits zero.
  useEffect(() => {
    if (countdown === 0 && !submittedRef.current) {
      doSubmit(true)
    }
  }, [countdown, doSubmit])

  if (!questions || !block) {
    return (
      <div className="flex h-64 items-center justify-center text-ero-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const q = questions[current]
  const answeredCount = questions.filter((x) => x.selected_option_id != null).length
  const unanswered = questions.length - answeredCount

  const pick = async (optionId: number) => {
    setQuestions((prev) =>
      prev!.map((x) =>
        x.attempt_question_id === q.attempt_question_id
          ? { ...x, selected_option_id: optionId }
          : x,
      ),
    )
    try {
      await saveAnswer(attempt.id, blockId, {
        attempt_question_id: q.attempt_question_id,
        selected_option_id: optionId,
        flagged: q.is_flagged,
      })
    } catch {
      // On a timer-expiry rejection, bounce back to the overview.
      doSubmit(true)
    }
  }

  const toggleFlag = async () => {
    const flagged = !q.is_flagged
    setQuestions((prev) =>
      prev!.map((x) =>
        x.attempt_question_id === q.attempt_question_id ? { ...x, is_flagged: flagged } : x,
      ),
    )
    await saveAnswer(attempt.id, blockId, {
      attempt_question_id: q.attempt_question_id,
      selected_option_id: q.selected_option_id,
      flagged,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Timer + progress header (screenshot 10) */}
      <div className="sticky top-0 z-10 -mx-4 bg-ero-bg/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">
            Block {block.display_position} · Question {current + 1} of {questions.length}
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
              (countdown ?? 0) < 60 ? 'bg-ero-danger/15 text-ero-danger' : 'bg-ero-bg-2 text-ero-text'
            }`}
          >
            <Clock className="h-4 w-4" /> {formatClock(countdown)}
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ero-bg-2">
          <div
            className="h-full rounded-full bg-ero-primary transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          {q.subject && <Badge>{q.subject}</Badge>}
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1 text-xs font-semibold ${
              q.is_flagged ? 'text-ero-warning' : 'text-ero-muted'
            }`}
          >
            <Flag className="h-4 w-4" fill={q.is_flagged ? 'currentColor' : 'none'} />
            {q.is_flagged ? 'Flagged' : 'Flag'}
          </button>
        </div>

        <p className="text-[15px] leading-relaxed">{q.stem}</p>
        {q.image_url && (
          <img src={q.image_url} alt="" className="max-h-64 rounded-xl border border-ero-border" />
        )}

        <div className="space-y-2.5">
          {q.options.map((opt) => {
            const selected = q.selected_option_id === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => pick(opt.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  selected
                    ? 'border-ero-primary bg-ero-primary/10'
                    : 'border-ero-border hover:border-ero-primary-400/60'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    selected ? 'border-ero-primary bg-ero-primary text-white' : 'border-ero-border text-ero-muted'
                  }`}
                >
                  {opt.letter}
                </span>
                <span className="text-sm">{opt.text}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          ← Previous
        </Button>
        <div className="text-xs text-ero-muted">
          {answeredCount}/{questions.length} answered
        </div>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => c + 1)}>Next →</Button>
        ) : (
          <Button variant="success" onClick={() => setConfirming(true)}>
            Submit Block
          </Button>
        )}
      </div>

      {/* Question palette */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {questions.map((x, i) => (
            <button
              key={x.attempt_question_id}
              onClick={() => setCurrent(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                i === current
                  ? 'bg-ero-primary text-white'
                  : x.is_flagged
                    ? 'bg-ero-warning/20 text-ero-warning'
                    : x.selected_option_id != null
                      ? 'bg-ero-success/20 text-ero-success'
                      : 'bg-ero-bg-2 text-ero-muted'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </Card>

      {/* Confirmation dialog */}
      {confirming && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">Submit this block?</h3>
            <p className="text-sm text-ero-muted">
              {unanswered > 0
                ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. `
                : 'All questions answered. '}
              Once submitted, this block is locked and cannot be reopened.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
                Keep Working
              </Button>
              <Button variant="success" fullWidth loading={submitting} onClick={() => doSubmit(false)}>
                Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
