import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, Clock, FileText, Trophy } from 'lucide-react'
import { fetchLevelLadder } from '../lib/queries'
import type { LevelLadder } from '../types'
import { Badge, Button, Card, Skeleton } from '../components/ui'

/**
 * FMGE level ladder (screenshot 1 — locked/unlocked month cards). Each level is
 * a 300-question full-length mock; a level unlocks when the previous one is
 * passed. Both the UI and the API enforce the lock.
 */
export default function Levels() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [ladder, setLadder] = useState<LevelLadder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetchLevelLadder(slug).then(setLadder).catch((e) => setError(e.message))
  }, [slug])

  if (error) return <Card className="mx-auto max-w-2xl"><p className="text-ero-danger">{error}</p></Card>
  if (!ladder) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{ladder.programme.name} Level Mocks</h1>
        <p className="mt-1 text-sm text-ero-muted">
          {ladder.levels} levels · pass each level mock (≥ {ladder.pass_accuracy}%) to unlock the next.
        </p>
      </div>

      <div className="space-y-3">
        {ladder.ladder.map((lvl) => {
          const locked = lvl.status === 'locked'
          const soon = lvl.status === 'coming_soon'
          const done = lvl.status === 'completed'
          return (
            <Card key={lvl.level} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
                    done
                      ? 'bg-ero-success/20 text-ero-success'
                      : locked || soon
                        ? 'bg-white/5 text-ero-faint'
                        : 'bg-ero-primary/20 text-ero-primary-400'
                  }`}
                >
                  {lvl.level}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{lvl.title}</span>
                    {lvl.passed && <Badge tone="success"><Trophy className="h-3 w-3" /> Passed</Badge>}
                    {done && !lvl.passed && <Badge tone="warning">Completed</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-ero-faint">
                    {lvl.total_questions != null && (
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {lvl.total_questions} questions</span>
                    )}
                    {lvl.duration_minutes != null && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lvl.duration_minutes} min</span>
                    )}
                    {lvl.best_accuracy != null && (
                      <span className="text-ero-muted">Best: {lvl.best_accuracy}%</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {soon ? (
                  <Badge tone="locked">Coming soon</Badge>
                ) : locked ? (
                  <Button variant="secondary" disabled>
                    <Lock className="h-4 w-4" /> Locked
                  </Button>
                ) : (
                  <Button
                    variant={done ? 'secondary' : 'primary'}
                    onClick={() => navigate(`/app/exams/${lvl.exam_id}/instructions`)}
                  >
                    {done ? 'Retake' : 'Start Mock'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
