import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, FileText, Layers, Lock } from 'lucide-react'
import { fetchProgramme } from '../lib/queries'
import type { ProgrammeDetail as PD } from '../types'
import { Badge, Button, Card, Skeleton } from '../components/ui'

export default function ProgrammeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [programme, setProgramme] = useState<PD | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetchProgramme(slug)
      .then(setProgramme)
      .catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <p className="text-ero-danger">{error}</p>
      </Card>
    )
  }

  if (!programme) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(120deg, ${programme.accent_color}, #0b1120)`,
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{programme.flag_emoji}</span>
          <div>
            <h1 className="text-3xl font-extrabold text-white">{programme.name}</h1>
            <p className="text-white/80">{programme.full_name}</p>
            <div className="mt-2">
              {programme.has_access ? (
                <Badge tone="success">Unlocked</Badge>
              ) : (
                <Badge tone="locked">
                  <Lock className="h-3 w-3" /> Redeem a code to unlock
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exams */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Examinations</h2>
        {programme.exams.length === 0 && (
          <Card>
            <p className="text-sm text-ero-muted">
              No published examinations yet for this programme.
            </p>
          </Card>
        )}
        <div className="space-y-3">
          {programme.exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{exam.title}</h3>
                  <Badge>{exam.type.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-ero-muted">{exam.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-ero-faint">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> {exam.block_count} blocks
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {exam.total_questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {exam.block_duration_minutes} min / block
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                {programme.has_access ? (
                  <Button onClick={() => navigate(`/app/exams/${exam.id}/instructions`)}>
                    Start <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    <Lock className="h-4 w-4" /> Locked
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Subjects (screenshot subject grid) */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Subjects</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {programme.subjects.map((s) => (
            <Card key={s.id} className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ background: s.color ?? '#2563EB' }}
              >
                {s.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-ero-muted">{s.question_count} questions</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div>
        <Link to="/app/exams" className="text-sm text-ero-primary-400">
          ← Back to all exams
        </Link>
      </div>
    </div>
  )
}
