import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { fetchAttemptHistory } from '../lib/queries'
import type { AttemptHistoryItem } from '../types'
import { Badge, Button, Card, EmptyState, Skeleton } from '../components/ui'

export default function Tests() {
  const [items, setItems] = useState<AttemptHistoryItem[] | null>(null)

  useEffect(() => {
    fetchAttemptHistory().then((r) => setItems(r.data))
  }, [])

  if (!items) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Skeleton className="h-10 w-40" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold">My Tests</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No attempts yet"
          description="Start a mock exam from a programme and it will appear here with your score and the option to review."
          action={<Link to="/app/exams"><Button>Browse Exams</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.flag_emoji ?? '🎓'}</span>
                <div>
                  <div className="font-semibold">{a.exam_title}</div>
                  <div className="text-xs text-ero-muted">
                    {a.programme} · {a.exam_type.replace('_', ' ')}
                    {a.completed_at && ` · ${new Date(a.completed_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.status === 'completed' ? (
                  <>
                    <div className="text-right">
                      <div className="text-lg font-bold">{a.accuracy}%</div>
                      <div className="text-xs text-ero-muted">{a.correct_count}/{a.total_questions}</div>
                    </div>
                    <Link to={`/app/attempts/${a.id}`}><Button variant="secondary" className="!px-3 !py-1.5 text-xs">Review</Button></Link>
                  </>
                ) : a.status === 'in_progress' ? (
                  <Link to={`/app/attempts/${a.id}`}><Button className="!px-3 !py-1.5 text-xs">Resume</Button></Link>
                ) : (
                  <Badge tone="danger">{a.status}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
