import { useEffect, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import { adminApi, type ImportPreview } from '../../lib/adminApi'
import { Badge, Button, Card } from '../../components/ui'
import type { ApiError } from '../../lib/api'

interface Prog { id: number; name: string }

export default function AdminImport() {
  const [programmes, setProgrammes] = useState<Prog[]>([])
  const [programmeId, setProgrammeId] = useState<number | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    adminApi.programmes().then((ps) => {
      setProgrammes(ps)
      if (ps[0]) setProgrammeId(ps[0].id)
    })
  }, [])

  const doPreview = async () => {
    if (!file || !programmeId) return
    setLoading(true)
    setError(null)
    setResult(null)
    setPreview(null)
    try {
      setPreview(await adminApi.importPreview(Number(programmeId), file))
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  const doCommit = async () => {
    if (!preview) return
    setCommitting(true)
    setError(null)
    try {
      const res = await adminApi.importCommit(preview.id, preview.stored_path)
      setResult(res.result)
      setPreview(null)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setCommitting(false)
    }
  }

  const downloadTemplate = () => {
    // Served by the API with the admin token via a normal fetch + blob.
    window.open('/api/v1/admin/imports/template', '_blank')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Import Questions</h1>
        <Button variant="ghost" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> CSV template
        </Button>
      </div>

      <Card className="space-y-4">
        <p className="text-sm text-ero-muted">
          Upload a CSV or XLSX file. We validate every row and show a preview — nothing
          is saved until you confirm. Required columns: <code>stem, option_a, option_b,
          correct, subject</code>. Optional: <code>option_c…</code>, <code>topic,
          difficulty, explanation, image_url</code>. <code>correct</code> is the option
          letter (A, B, C…).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ero-muted">Programme</span>
            <select
              value={programmeId}
              onChange={(e) => setProgrammeId(Number(e.target.value))}
              className="w-full rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-3 text-ero-text focus:border-ero-primary-400 focus:outline-none"
            >
              {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ero-muted">File</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-2.5 text-sm text-ero-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ero-primary file:px-3 file:py-1.5 file:text-white"
            />
          </label>
        </div>

        <Button onClick={doPreview} loading={loading} disabled={!file || !programmeId}>
          <Upload className="h-4 w-4" /> Validate &amp; Preview
        </Button>
      </Card>

      {error && (
        <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">{error}</div>
      )}

      {result && (
        <Card className="border-ero-success/40">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-ero-success" />
            <div>
              <div className="font-semibold">Import complete</div>
              <div className="text-sm text-ero-muted">
                {result.imported} questions imported, {result.skipped} skipped (invalid).
              </div>
            </div>
          </div>
        </Card>
      )}

      {preview && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-ero-primary-400" />
            <span className="font-semibold">{preview.filename}</span>
            <Badge>{preview.total_rows} rows</Badge>
            <Badge tone="success">{preview.valid_rows} valid</Badge>
            {preview.error_rows > 0 && <Badge tone="danger">{preview.error_rows} with errors</Badge>}
          </div>

          {preview.error_rows > 0 && (
            <div className="rounded-xl bg-ero-warning/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ero-warning">
                <AlertTriangle className="h-4 w-4" /> Rows with errors (these will be skipped)
              </div>
              <ul className="max-h-40 space-y-1 overflow-auto text-xs text-ero-muted">
                {preview.errors.slice(0, 20).map((e) => (
                  <li key={e.row}>Row {e.row}: {e.messages.join('; ')}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-ero-faint">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Question</th>
                  <th className="px-2 py-2">Subject</th>
                  <th className="px-2 py-2">Correct</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row) => (
                  <tr key={row.row} className="border-t border-ero-border">
                    <td className="px-2 py-2 text-ero-faint">{row.row}</td>
                    <td className="px-2 py-2">
                      {row.valid ? <Badge tone="success">OK</Badge> : <Badge tone="danger">Error</Badge>}
                    </td>
                    <td className="px-2 py-2">{row.stem}</td>
                    <td className="px-2 py-2 text-ero-muted">{row.subject}</td>
                    <td className="px-2 py-2 font-semibold">{row.correct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-ero-muted">
              {preview.valid_rows} valid question{preview.valid_rows !== 1 ? 's' : ''} will be imported.
            </p>
            <Button
              variant="success"
              onClick={doCommit}
              loading={committing}
              disabled={preview.valid_rows === 0}
            >
              Import {preview.valid_rows} Questions
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
