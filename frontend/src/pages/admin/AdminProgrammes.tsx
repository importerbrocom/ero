import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/adminApi'
import { Badge, Card, Skeleton } from '../../components/ui'

interface AdminProgramme {
  id: number
  name: string
  full_name: string
  slug: string
  status: string
  flag_emoji: string | null
  questions_count: number
  subjects_count: number
  exams_count: number
}

export default function AdminProgrammes() {
  const [programmes, setProgrammes] = useState<AdminProgramme[] | null>(null)

  useEffect(() => { adminApi.programmes().then(setProgrammes) }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Programmes</h1>
      {!programmes ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programmes.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.flag_emoji ?? '🎓'}</span>
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-ero-muted">{p.full_name}</div>
                  </div>
                </div>
                <Badge tone={p.status === 'published' ? 'success' : p.status === 'archived' ? 'locked' : 'warning'}>
                  {p.status}
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-ero-muted">
                <span>{p.questions_count} questions</span>
                <span>{p.subjects_count} subjects</span>
                <span>{p.exams_count} exams</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-sm text-ero-faint">
        Exam structure (block counts, durations, 55-min schedule, retry &amp; result-visibility rules)
        is configured per exam via the API and stored in the database — nothing is hard-coded.
      </p>
    </div>
  )
}
