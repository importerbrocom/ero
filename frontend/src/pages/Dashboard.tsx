import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flame,
  XCircle,
  ClipboardList,
  FileText,
  Layers,
} from 'lucide-react'
import { fetchAnalytics, fetchProgrammes } from '../lib/queries'
import type { AnalyticsOverview, Programme } from '../types'
import { Button, Card, EmptyState, HeroBanner, ProgressRing, Skeleton, StatCard } from '../components/ui'
import { useAuth } from '../store/auth'

export default function Dashboard() {
  const user = useAuth((s) => s.user)
  const [programmes, setProgrammes] = useState<Programme[] | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)

  useEffect(() => {
    fetchProgrammes().then(setProgrammes)
    fetchAnalytics().then(setAnalytics).catch(() => setAnalytics(null))
  }, [])

  const accessible = programmes?.filter((p) => p.has_access) ?? []
  const hasStarted = analytics?.has_activity ?? false

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome hero with monthly-goal progress (screenshot 4) */}
      <HeroBanner
        title={<>Welcome Back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</>}
        subtitle={<span className="text-ero-text">Let's continue your preparation</span>}
      >
        <div className="max-w-sm">
          <div className="mb-1 flex items-center justify-between text-xs text-ero-muted">
            <span>Your Monthly Goal</span>
            <span>{analytics?.questions_attempted ?? 0} questions</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="ero-grad-primary h-full rounded-full"
              style={{ width: `${Math.min(100, ((analytics?.questions_attempted ?? 0) / 300) * 100)}%` }}
            />
          </div>
          <Link to="/app/exams">
            <Button className="mt-4">
              Choose an Exam <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* Quick-action tiles (colored, screenshot 4) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickTile icon={<ClipboardList className="h-6 w-6" />} title="Today's Quiz" sub="10 Questions" to="/app/exams" grad="ero-grad-primary" />
        <QuickTile icon={<FileText className="h-6 w-6" />} title="Mock Tests" sub="Full Length" to="/app/tests" grad="ero-grad-success" />
        <QuickTile icon={<BookOpen className="h-6 w-6" />} title="Programmes" sub="All Exams" to="/app/exams" grad="ero-grad-purple" />
        <QuickTile icon={<CalendarDays className="h-6 w-6" />} title="Progress" sub="Analytics" to="/app/progress" grad="ero-grad-amber" />
      </div>

      {/* Overall progress */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Overall Progress</h2>
          {hasStarted && <span className="text-xs text-ero-muted">All time</span>}
        </div>
        {hasStarted && analytics ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="flex flex-col items-center justify-center">
              <ProgressRing value={analytics.overall_accuracy} label="Accuracy" />
            </Card>
            <StatCard icon={<ClipboardList className="h-6 w-6" />} value={analytics.questions_attempted} label="Questions Attempted" />
            <StatCard icon={<CheckCircle2 className="h-6 w-6" />} value={analytics.correct} label="Correct" tone="success" />
            <StatCard icon={<XCircle className="h-6 w-6" />} value={analytics.incorrect} label="Incorrect" tone="danger" />
          </div>
        ) : (
          <EmptyState
            icon={<BarChartPlaceholder />}
            title="No attempts yet"
            description="Your accuracy, questions attempted and streak will appear here once you complete your first practice session or mock exam."
            action={
              <Link to="/app/exams">
                <Button>Start your first session</Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* My programmes */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">My Programmes</h2>
          <Link to="/app/exams" className="text-sm font-semibold text-ero-primary-400">
            View All →
          </Link>
        </div>
        {!programmes && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {programmes && accessible.length === 0 && (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No programmes unlocked"
            description="Redeem an activation code or browse available exam programmes to get started."
            action={
              <Link to="/app/exams">
                <Button>Browse Exams</Button>
              </Link>
            }
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {accessible.map((p) => (
            <Link key={p.id} to={`/app/programmes/${p.slug}`}>
              <div
                className="flex items-center justify-between rounded-xl border border-ero-border p-4 transition-colors hover:border-ero-primary-400"
                style={{ backgroundImage: `linear-gradient(120deg, ${p.accent_color}1f 0%, var(--color-ero-card) 60%)` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.flag_emoji}</span>
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-xs text-ero-muted">
                      {p.question_count.toLocaleString()} questions
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-ero-muted" />
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Streak strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Flame className="h-6 w-6" />} value={analytics?.current_streak ?? 0} label="Current Streak" tone="streak" />
        <StatCard icon={<CheckCircle2 className="h-6 w-6" />} value={analytics?.days_completed ?? 0} label="Days Completed" tone="success" />
        <StatCard icon={<ClipboardList className="h-6 w-6" />} value={analytics?.questions_attempted ?? 0} label="Questions Answered" tone="cyan" />
        <StatCard icon={<Layers className="h-6 w-6" />} value={accessible.length} label="Programmes" tone="purple" />
      </div>
    </div>
  )
}

function QuickTile({
  icon,
  title,
  sub,
  to,
  grad,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  to: string
  grad: string
}) {
  return (
    <Link to={to}>
      <div className={`${grad} relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl p-4 text-white transition-transform hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between">
          <span className="opacity-90">{icon}</span>
          <ArrowRight className="h-4 w-4 opacity-80" />
        </div>
        <div>
          <div className="text-sm font-bold">{title}</div>
          <div className="text-xs opacity-80">{sub}</div>
        </div>
      </div>
    </Link>
  )
}

function BarChartPlaceholder() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" strokeLinecap="round" />
      <rect x="7" y="12" width="3" height="6" rx="1" />
      <rect x="12" y="8" width="3" height="10" rx="1" />
      <rect x="17" y="5" width="3" height="13" rx="1" />
    </svg>
  )
}
