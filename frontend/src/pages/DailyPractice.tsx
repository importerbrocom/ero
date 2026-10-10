import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flame, CheckCircle2, Lock, Play, CalendarCheck, Loader2 } from 'lucide-react'
import { enrollPractice, fetchPracticePlan } from '../lib/queries'
import type { PracticePlan } from '../types'
import { Badge, Button, Card, KpiChip, ProgressRing } from '../components/ui'
import type { ApiError } from '../lib/api'

/**
 * Entry: /app/exams/:examId/practice  — enrolls (idempotent) then shows the plan.
 * Also reachable as /app/practice/:enrollmentId once enrolled.
 */
export default function DailyPractice() {
  const { examId, enrollmentId } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<PracticePlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = enrollmentId
      ? fetchPracticePlan(Number(enrollmentId))
      : enrollPractice(Number(examId))
    load.then(setPlan).catch((e) => setError((e as ApiError).message))
  }, [examId, enrollmentId])

  if (error) return <Card className="mx-auto max-w-xl"><p className="text-ero-danger">{error}</p></Card>
  if (!plan) {
    return <div className="flex h-64 items-center justify-center text-ero-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  const pct = plan.plan_days > 0 ? (plan.completed_days / plan.plan_days) * 100 : 0

  const openDay = (day: number) => navigate(`/app/practice/${plan.enrollment_id}/day/${day}`)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ero-primary-600 via-ero-primary to-ero-accent p-6">
        <h1 className="text-2xl font-extrabold text-white">{plan.title}</h1>
        <p className="mt-1 text-sm text-white/80">
          {plan.questions_per_day} questions every day · {plan.plan_days}-day plan
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex items-center justify-center">
          <ProgressRing value={pct} size={76} label="Complete" />
        </Card>
        <KpiChip icon={<CalendarCheck className="h-6 w-6" />} value={`${plan.completed_days}/${plan.plan_days}`} label="Days Done" tone="success" />
        <KpiChip icon={<Flame className="h-6 w-6" />} value={plan.streak} label="Current Streak" tone="streak" />
        <KpiChip icon={<Flame className="h-6 w-6" />} value={plan.best_streak} label="Best Streak" tone="streak" />
      </div>

      {/* Continue CTA */}
      {plan.current_day <= plan.plan_days && (
        <Card className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Day {plan.current_day}</div>
            <div className="text-sm text-ero-muted">
              {plan.questions_per_day} new questions to build your streak.
            </div>
          </div>
          <Button onClick={() => openDay(plan.current_day)}>
            <Play className="h-4 w-4" /> Continue
          </Button>
        </Card>
      )}

      {/* Day grid (screenshot 1 locked/unlocked style) */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Study Days</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plan.schedule.map((d) => {
            const locked = d.status === 'locked'
            const done = d.status === 'completed'
            return (
              <Card key={d.day_number} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                    done ? 'bg-ero-success/20 text-ero-success' : locked ? 'bg-white/5 text-ero-faint' : 'bg-ero-primary/20 text-ero-primary-400'
                  }`}>
                    {d.day_number}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Day {d.day_number}</div>
                    {done ? (
                      <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> {d.accuracy}%</Badge>
                    ) : locked ? (
                      <Badge tone="locked"><Lock className="h-3 w-3" /> Locked</Badge>
                    ) : (
                      <Badge>Available</Badge>
                    )}
                  </div>
                </div>
                {!locked && (
                  <Button
                    variant={done ? 'secondary' : 'primary'}
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => openDay(d.day_number)}
                  >
                    {done ? 'Review' : 'Start'}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
