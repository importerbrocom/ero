import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { adminApi, type AdminStudent, type Paginated } from '../../lib/adminApi'
import { Badge, Button, Card, Skeleton } from '../../components/ui'

export default function AdminStudents() {
  const [page, setPage] = useState<Paginated<AdminStudent> | null>(null)
  const [search, setSearch] = useState('')
  const [current, setCurrent] = useState(1)
  const [busy, setBusy] = useState<number | null>(null)

  const load = () =>
    adminApi.students({ search: search || undefined, page: current }).then(setPage)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const toggleStatus = async (s: AdminStudent) => {
    setBusy(s.id)
    try {
      await adminApi.setStudentStatus(s.id, s.status === 'active' ? 'suspended' : 'active')
      await load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Students</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); setCurrent(1); load() }}
        className="relative max-w-md"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ero-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-ero-border bg-ero-bg-2 py-3 pl-11 pr-4 text-ero-text placeholder:text-ero-faint focus:border-ero-primary-400 focus:outline-none"
        />
      </form>

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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((s) => (
                  <tr key={s.id} className="border-b border-ero-border/50">
                    <td className="px-4 py-3 font-semibold">{s.name}</td>
                    <td className="px-4 py-3 text-ero-muted">{s.email}</td>
                    <td className="px-4 py-3 text-ero-muted">{s.country ?? '—'}</td>
                    <td className="px-4 py-3">{s.attempts_count}</td>
                    <td className="px-4 py-3">
                      {s.status === 'active'
                        ? <Badge tone="success">Active</Badge>
                        : <Badge tone="danger">Suspended</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1.5 text-xs"
                        loading={busy === s.id}
                        onClick={() => toggleStatus(s)}
                      >
                        {s.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {page.data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-ero-muted">No students found.</td></tr>
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
