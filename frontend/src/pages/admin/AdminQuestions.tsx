import { useEffect, useState } from 'react'
import { adminApi, type AdminQuestion, type Paginated } from '../../lib/adminApi'
import { Badge, Button, Card, Skeleton } from '../../components/ui'

export default function AdminQuestions() {
  const [page, setPage] = useState<Paginated<AdminQuestion> | null>(null)
  const [current, setCurrent] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const load = () =>
    adminApi.questions({
      page: current,
      status: status || undefined,
      search: search || undefined,
    }).then(setPage)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status])

  const archive = async (id: number) => {
    setBusy(id)
    try {
      await adminApi.archiveQuestion(id)
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Question Bank</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setCurrent(1); load() }} className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text…"
            className="w-full rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-3 text-ero-text placeholder:text-ero-faint focus:border-ero-primary-400 focus:outline-none"
          />
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setCurrent(1) }}
          className="rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-3 text-ero-text focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <Card className="p-0">
        {!page ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-ero-faint">
                <tr className="border-b border-ero-border">
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Options</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((q) => (
                  <tr key={q.id} className="border-b border-ero-border/50">
                    <td className="max-w-md px-4 py-3">
                      <span className="line-clamp-2">{q.stem}</span>
                    </td>
                    <td className="px-4 py-3 text-ero-muted">{q.subject?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-ero-muted">{q.difficulty}</td>
                    <td className="px-4 py-3">{q.options_count}</td>
                    <td className="px-4 py-3">
                      <Badge tone={q.status === 'active' ? 'success' : q.status === 'archived' ? 'locked' : 'warning'}>
                        {q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {q.status !== 'archived' && (
                        <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-ero-danger" loading={busy === q.id} onClick={() => archive(q.id)}>
                          Archive
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {page.data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-ero-muted">No questions found. Import some via the Import tab.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {page && page.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={current <= 1} onClick={() => setCurrent((c) => c - 1)}>Prev</Button>
          <span className="text-sm text-ero-muted">Page {page.meta.current_page} of {page.meta.last_page}</span>
          <Button variant="secondary" disabled={current >= page.meta.last_page} onClick={() => setCurrent((c) => c + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
