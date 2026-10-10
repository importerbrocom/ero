import { useEffect, useState } from 'react'
import { Users, FileQuestion, ClipboardCheck, BookMarked, Activity } from 'lucide-react'
import { adminApi, type AdminOverview as Overview } from '../../lib/adminApi'
import { Card, KpiChip, Skeleton } from '../../components/ui'

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.overview().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <Card><p className="text-ero-danger">{error}</p></Card>
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Admin Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiChip icon={<Users className="h-6 w-6" />} value={data.students.total} label="Total Students" />
        <KpiChip icon={<Users className="h-6 w-6" />} value={data.students.active} label="Active Students" tone="success" />
        <KpiChip icon={<ClipboardCheck className="h-6 w-6" />} value={data.attempts.completed} label="Completed Attempts" />
        <KpiChip icon={<Activity className="h-6 w-6" />} value={`${data.attempts.average_accuracy}%`} label="Avg Accuracy" tone="streak" />
        <KpiChip icon={<BookMarked className="h-6 w-6" />} value={data.content.programmes} label="Programmes" />
        <KpiChip icon={<FileQuestion className="h-6 w-6" />} value={data.content.questions} label="Questions" />
        <KpiChip icon={<FileQuestion className="h-6 w-6" />} value={data.content.active_questions} label="Active Questions" tone="success" />
        <KpiChip icon={<ClipboardCheck className="h-6 w-6" />} value={data.attempts.in_progress} label="In Progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Programme Performance</h2>
          <div className="space-y-3">
            {data.programme_performance.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-ero-bg-2 px-4 py-3">
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm text-ero-muted">
                  {p.questions} questions · {p.attempts} attempts
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-ero-muted">No logged activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>
                    <code className="rounded bg-ero-bg-2 px-1.5 py-0.5 text-xs text-ero-primary-400">{a.action}</code>
                    {a.user && <span className="ml-2 text-ero-muted">by {a.user}</span>}
                  </span>
                  <span className="text-xs text-ero-faint">{new Date(a.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
