import { useEffect, useState } from 'react'
import { adminApi, type AuditEntry, type Paginated } from '../../lib/adminApi'
import { Card, Skeleton } from '../../components/ui'

export default function AdminAudit() {
  const [page, setPage] = useState<Paginated<AuditEntry> | null>(null)
  const [current, setCurrent] = useState(1)

  useEffect(() => { adminApi.auditLogs({ page: current }).then(setPage) }, [current])

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Audit Logs</h1>
      <Card className="p-0">
        {!page ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-ero-faint">
                <tr className="border-b border-ero-border">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((log) => (
                  <tr key={log.id} className="border-b border-ero-border/50">
                    <td className="px-4 py-3">
                      <code className="rounded bg-ero-bg-2 px-1.5 py-0.5 text-xs text-ero-primary-400">{log.action}</code>
                    </td>
                    <td className="px-4 py-3 text-ero-muted">{log.user?.name ?? 'System'}</td>
                    <td className="px-4 py-3 text-ero-faint">
                      {log.subject_type ? `${log.subject_type.split('\\').pop()} #${log.subject_id}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-ero-faint">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {page.data.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-ero-muted">No audit entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {page && page.meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-ero-muted">
          <button disabled={current <= 1} onClick={() => setCurrent((c) => c - 1)} className="disabled:opacity-40">Prev</button>
          <span>Page {page.meta.current_page} of {page.meta.last_page}</span>
          <button disabled={current >= page.meta.last_page} onClick={() => setCurrent((c) => c + 1)} className="disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
