import { useEffect, useState } from 'react'
import { KeyRound, Copy } from 'lucide-react'
import { adminApi, type AdminActivationCode, type Paginated } from '../../lib/adminApi'
import { Badge, Button, Card, Input, Skeleton } from '../../components/ui'
import type { ApiError } from '../../lib/api'

interface Prog { id: number; name: string }

export default function AdminCodes() {
  const [page, setPage] = useState<Paginated<AdminActivationCode> | null>(null)
  const [programmes, setProgrammes] = useState<Prog[]>([])
  const [form, setForm] = useState({ exam_programme_id: '', quantity: 10, max_redemptions: 1, multi_use: false })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => adminApi.activationCodes().then(setPage)
  useEffect(() => { load(); adminApi.programmes().then(setProgrammes) }, [])

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await adminApi.generateCodes({
        exam_programme_id: form.exam_programme_id ? Number(form.exam_programme_id) : undefined,
        quantity: Number(form.quantity),
        max_redemptions: Number(form.max_redemptions),
        multi_use: form.multi_use,
      })
      setGenerated(res.codes.map((c: AdminActivationCode) => c.code))
      await load()
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setGenerating(false)
    }
  }

  const revoke = async (id: number) => { await adminApi.revokeCode(id); await load() }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Activation Codes</h1>

      <Card className="space-y-4">
        <h2 className="font-bold">Generate a batch</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ero-muted">Programme</span>
            <select
              value={form.exam_programme_id}
              onChange={(e) => setForm((f) => ({ ...f, exam_programme_id: e.target.value }))}
              className="w-full rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-3 text-ero-text focus:outline-none"
            >
              <option value="">Any / unassigned</option>
              {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <Input label="Quantity" type="number" min={1} max={1000} value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
          <Input label="Max redemptions" type="number" min={1} value={form.max_redemptions}
            onChange={(e) => setForm((f) => ({ ...f, max_redemptions: Number(e.target.value) }))} />
          <label className="flex items-end gap-2 pb-3 text-sm text-ero-muted">
            <input type="checkbox" checked={form.multi_use}
              onChange={(e) => setForm((f) => ({ ...f, multi_use: e.target.checked }))} />
            Multi-use
          </label>
        </div>
        <Button onClick={generate} loading={generating}>
          <KeyRound className="h-4 w-4" /> Generate
        </Button>
        {error && <p className="text-sm text-ero-danger">{error}</p>}
        {generated && (
          <div className="rounded-xl bg-ero-success/10 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ero-success">{generated.length} codes generated</span>
              <button
                onClick={() => navigator.clipboard.writeText(generated.join('\n'))}
                className="flex items-center gap-1 text-xs text-ero-primary-400"
              >
                <Copy className="h-3 w-3" /> Copy all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs text-ero-muted sm:grid-cols-3">
              {generated.map((c) => <span key={c}>{c}</span>)}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-0">
        {!page ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-ero-faint">
                <tr className="border-b border-ero-border">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {page.data.map((c) => (
                  <tr key={c.id} className="border-b border-ero-border/50">
                    <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                    <td className="px-4 py-3 text-ero-muted">{c.programme?.name ?? 'Any'}</td>
                    <td className="px-4 py-3">{c.redemption_count}/{c.max_redemptions}</td>
                    <td className="px-4 py-3">
                      {c.status === 'active' ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Revoked</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'active' && (
                        <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-ero-danger" onClick={() => revoke(c.id)}>Revoke</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
