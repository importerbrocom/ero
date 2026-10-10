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
} from 'lucide-react'
import { fetchProgrammes } from '../lib/queries'
import type { Programme } from '../types'
import { Button, Card, EmptyState, KpiChip, ProgressRing, Skeleton } from '../components/ui'
import { useAuth } from '../store/auth'

export default function Dashboard() {
  const user = useAuth((s) => s.user)
  const [programmes, setProgrammes] = useState<Programme[] | null>(null)

  useEffect(() => {
    fetchProgrammes().then(setProgrammes)
  }, [])

  const accessible = programmes?.filter((p) => p.has_access) ?? []
  const hasStarted = false // real stats would come from a progress endpoint

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome hero (screenshot 4) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ero-primary-600 via-ero-primary to-ero-accent p-6">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80">Welcome back</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            {user?.name}, let's continue your preparation
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Pick up where you left off or start a new mock exam.
          </p>
          <Link to="/app/exams">
            <Button className="mt-4 bg-white !text-ero-primary-600 hover:bg-white/90">
              Choose an Exam <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick action tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickTile icon={<ClipboardList />} label="Daily Practice" to="/app/exams" />
        <QuickTile icon={<FileText />} label="Mock Tests" to="/app/tests" />
        <QuickTile icon={<BookOpen />} label="Programmes" to="/app/exams" />
        <QuickTile icon={<CalendarDays />} label="Progress" to="/app/progress" />
      </div>

      {/* Overall progress — honest empty state for a new student (no fake stats) */}
      <Card>
        <h2 className="mb-4 text-lg font-bold">Overall Progress</h2>
        {hasStarted ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center justify-center">
              <ProgressRing value={0} label="Accuracy" />
            </div>
            <KpiChip icon={<ClipboardList className="h-6 w-6" />} value={0} label="Attempted" />
            <KpiChip icon={<CheckCircle2 className="h-6 w-6" />} value={0} label="Correct" tone="success" />
            <KpiChip icon={<XCircle className="h-6 w-6" />} value={0} label="Incorrect" tone="danger" />
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
            View All
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
              <Card className="flex items-center justify-between transition-colors hover:border-ero-primary-400">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.flag_emoji}</span>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-ero-muted">
                      {p.question_count.toLocaleString()} questions
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-ero-muted" />
              </Card>
            </Link>
          ))}
        </div>
      </Card>

      {/* Streak strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiChip icon={<Flame className="h-6 w-6" />} value={0} label="Current Streak" tone="streak" />
        <KpiChip icon={<CheckCircle2 className="h-6 w-6" />} value={0} label="Days Completed" tone="success" />
        <KpiChip icon={<ClipboardList className="h-6 w-6" />} value={0} label="Questions Answered" />
        <KpiChip icon={<FileText className="h-6 w-6" />} value={accessible.length} label="Programmes" />
      </div>
    </div>
  )
}

function QuickTile({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to}>
      <Card className="flex h-full flex-col justify-between gap-6 transition-colors hover:border-ero-primary-400">
        <div className="text-ero-primary-400">{icon}</div>
        <div className="flex items-center justify-between text-sm font-semibold">
          {label}
          <ArrowRight className="h-4 w-4 text-ero-muted" />
        </div>
      </Card>
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
