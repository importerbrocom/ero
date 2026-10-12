import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  FileText,
  Layers,
  Lock,
  Play,
  BookOpen,
} from 'lucide-react'
import { fetchProgramme, fetchAnalytics } from '../lib/queries'
import type { AnalyticsOverview, ProgrammeDetail as PD } from '../types'
import { Badge, Button, Card, FlagMark, HeroBanner, Skeleton, StatCard, SubjectTile, Tabs } from '../components/ui'

type TabKey = 'overview' | 'mocks' | 'subjects'

export default function ProgrammeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [programme, setProgramme] = useState<PD | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')

  useEffect(() => {
    if (!slug) return
    fetchProgramme(slug)
      .then((p) => {
        setProgramme(p)
        fetchAnalytics(p.id).then(setAnalytics).catch(() => setAnalytics(null))
      })
      .catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return <Card className="mx-auto max-w-2xl text-center"><p className="text-ero-danger">{error}</p></Card>
  }
  if (!programme) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const dailyExam = programme.exams.find((e) => e.type === 'daily_practice')
  const mockExams = programme.exams.filter((e) => e.type !== 'level_mock' && e.type !== 'daily_practice')
  const perDay = dailyExam?.questions_per_day ?? 10

  const startExam = (id: number, type: string) =>
    navigate(type === 'daily_practice' ? `/app/exams/${id}/practice` : `/app/exams/${id}/instructions`)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Programme header */}
      <div className="flex items-center gap-3">
        <FlagMark imageUrl={programme.flag_image_url} emoji={programme.flag_emoji} size={40} />
        <div>
          <h1 className="text-2xl font-extrabold text-white">{programme.name}</h1>
          <p className="text-sm text-ero-muted">{programme.full_name}</p>
        </div>
        <div className="ml-auto">
          {programme.has_access ? (
            <Badge tone="success">Unlocked</Badge>
          ) : (
            <Badge tone="locked"><Lock className="h-3 w-3" /> Locked</Badge>
          )}
        </div>
      </div>

      {/* Daily-practice hero (screenshot 2) */}
      {dailyExam && (
        <HeroBanner
          variant={programme.cover_image_url ? 'hero' : 'primary'}
          image={programme.cover_image_url ?? undefined}
          eyebrow={`Crack ${programme.name} with`}
          title="Daily Practice"
          subtitle={`${perDay} questions every day. Monthly full-length mock test.`}
        >
          {programme.has_access ? (
            <Button onClick={() => startExam(dailyExam.id, dailyExam.type)}>
              <Play className="h-4 w-4" /> Continue Today's Quiz
            </Button>
          ) : (
            <Button variant="secondary" disabled><Lock className="h-4 w-4" /> Locked</Button>
          )}
        </HeroBanner>
      )}

      {/* Tabs */}
      <Tabs<TabKey>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'subjects', label: 'Subjects' },
          { key: 'mocks', label: 'Mock Tests' },
        ]}
      />

      {/* --- Overview --- */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<FileText className="h-6 w-6" />} value={`${analytics?.overall_accuracy ?? 0}%`} label="Overall Accuracy" />
            <StatCard icon={<FileText className="h-6 w-6" />} value={analytics?.questions_attempted ?? 0} label="Questions Answered" tone="cyan" />
            <StatCard icon={<FileText className="h-6 w-6" />} value={analytics?.days_completed ?? 0} label="Days Completed" tone="success" />
            <StatCard icon={<FileText className="h-6 w-6" />} value={analytics?.current_streak ?? 0} label="Current Streak" tone="streak" />
          </div>

          {programme.has_access && programme.exams.some((e) => e.type === 'level_mock') && (
            <Card className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Level Mocks</h3>
                <p className="text-sm text-ero-muted">Pass each level to unlock the next.</p>
              </div>
              <Button onClick={() => navigate(`/app/programmes/${programme.slug}/levels`)}>
                View Levels <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* Subject-wise practice (3-col grid like the screenshot) */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Subject-wise Practice</h2>
              <button onClick={() => setTab('subjects')} className="text-sm font-semibold text-ero-primary-400">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {programme.subjects.slice(0, 6).map((s) => (
                <SubjectTile
                  key={s.id}
                  icon={<BookOpen className="h-5 w-5" />}
                  name={s.name}
                  count={`${s.question_count} Questions`}
                  color={s.color ?? '#086BFF'}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* --- Subjects --- */}
      {tab === 'subjects' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programme.subjects.map((s) => (
            <SubjectTile
              key={s.id}
              icon={<BookOpen className="h-5 w-5" />}
              name={s.name}
              count={`${s.question_count} Questions`}
              color={s.color ?? '#086BFF'}
            />
          ))}
          {programme.subjects.length === 0 && (
            <Card className="sm:col-span-3"><p className="text-sm text-ero-muted">No subjects configured yet.</p></Card>
          )}
        </div>
      )}

      {/* --- Mock Tests --- */}
      {tab === 'mocks' && (
        <div className="space-y-3">
          {mockExams.length === 0 && (
            <Card><p className="text-sm text-ero-muted">No published examinations yet for this programme.</p></Card>
          )}
          {mockExams.map((exam) => (
            <Card key={exam.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{exam.title}</h3>
                  <Badge>{exam.type.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-ero-muted">{exam.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-ero-faint">
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {exam.block_count} blocks</span>
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {exam.total_questions} questions</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.block_duration_minutes} min / block</span>
                </div>
              </div>
              <div className="shrink-0">
                {programme.has_access ? (
                  <Button onClick={() => startExam(exam.id, exam.type)}>Start <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button variant="secondary" disabled><Lock className="h-4 w-4" /> Locked</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <Link to="/app/exams" className="text-sm text-ero-primary-400">← Back to all exams</Link>
      </div>
    </div>
  )
}
