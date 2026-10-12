import { useEffect, useState } from 'react'
import { Plus, Pencil, ImagePlus, Loader2 } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import { Badge, Button, Card, FlagMark, Input, Skeleton, toFlagEmoji } from '../../components/ui'
import type { ApiError } from '../../lib/api'

interface AdminProgramme {
  id: number
  name: string
  full_name: string
  slug: string
  status: string
  flag_emoji: string | null
  flag_image_url?: string | null
  accent_color?: string | null
  cover_image_url?: string | null
  country?: string | null
  description?: string | null
  questions_count: number
  subjects_count: number
  exams_count: number
}

type FormState = {
  id?: number
  name: string
  slug: string
  full_name: string
  country: string
  flag_emoji: string
  flag_image_url: string
  accent_color: string
  description: string
  cover_image_url: string
  status: string
}

const EMPTY: FormState = {
  name: '', slug: '', full_name: '', country: '', flag_emoji: '', flag_image_url: '',
  accent_color: '#086BFF', description: '', cover_image_url: '', status: 'draft',
}

export default function AdminProgrammes() {
  const [programmes, setProgrammes] = useState<AdminProgramme[] | null>(null)
  const [form, setForm] = useState<FormState | null>(null)

  const load = () => adminApi.programmes().then(setProgrammes)
  useEffect(() => { load() }, [])

  const openNew = () => setForm({ ...EMPTY })
  const openEdit = (p: AdminProgramme) =>
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      full_name: p.full_name,
      country: p.country ?? '',
      flag_emoji: p.flag_emoji ?? '',
      flag_image_url: p.flag_image_url ?? '',
      accent_color: p.accent_color ?? '#086BFF',
      description: p.description ?? '',
      cover_image_url: p.cover_image_url ?? '',
      status: p.status,
    })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Programmes</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Programme</Button>
      </div>

      {!programmes ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programmes.map((p) => (
            <Card key={p.id} className="space-y-3 p-0 overflow-hidden">
              {/* Cover image strip */}
              <div className="relative h-24 w-full bg-ero-bg-2">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ backgroundImage: `linear-gradient(120deg, ${p.accent_color ?? '#086BFF'}, #061a32)` }}
                  />
                )}
                <span className="absolute right-2 top-2">
                  <Badge tone={p.status === 'published' ? 'success' : p.status === 'archived' ? 'locked' : 'warning'}>
                    {p.status}
                  </Badge>
                </span>
              </div>
              <div className="p-4 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlagMark imageUrl={p.flag_image_url} emoji={p.flag_emoji} size={26} />
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-ero-muted">{p.full_name}</div>
                    </div>
                  </div>
                  <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-ero-muted">
                  <span>{p.questions_count} questions</span>
                  <span>{p.subjects_count} subjects</span>
                  <span>{p.exams_count} exams</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {form && (
        <ProgrammeForm
          initial={form}
          onClose={() => setForm(null)}
          onSaved={async () => { setForm(null); await load() }}
        />
      )}
    </div>
  )
}

function ProgrammeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: FormState
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!form.id

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const [flagUploading, setFlagUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const res = await adminApi.uploadImage(file, 'programmes')
      setForm((f) => ({ ...f, cover_image_url: res.url }))
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setUploading(false)
    }
  }

  const uploadFlag = async (file: File) => {
    setFlagUploading(true)
    setError(null)
    try {
      const res = await adminApi.uploadImage(file, 'flags')
      setForm((f) => ({ ...f, flag_image_url: res.url }))
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setFlagUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        full_name: form.full_name,
        country: form.country || null,
        flag_emoji: form.flag_emoji || null,
        flag_image_url: form.flag_image_url || null,
        accent_color: form.accent_color,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        status: form.status,
      }
      if (isEdit) await adminApi.updateProgramme(form.id!, payload)
      else await adminApi.createProgramme({ ...payload, slug: form.slug })
      onSaved()
    } catch (e) {
      const err = e as ApiError
      setError(err.message + (err.errors ? ' — ' + Object.values(err.errors).flat().join(' ') : ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <h2 className="mb-4 text-lg font-bold">{isEdit ? 'Edit Programme' : 'New Programme'}</h2>
        {error && <div className="mb-3 rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">{error}</div>}

        {/* Cover image uploader */}
        <div className="mb-4">
          <span className="mb-1.5 block text-sm font-medium text-ero-muted">Cover image (landmark / banner)</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-ero-border bg-ero-bg-2">
              {form.cover_image_url ? (
                <img src={form.cover_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ero-faint">
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-xl border border-ero-border bg-ero-input px-4 py-2.5 text-sm font-semibold">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {form.cover_image_url ? 'Replace' : 'Upload'} image
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          </div>
          <p className="mt-1 text-xs text-ero-faint">
            Recommended <b>800 × 400 px</b> (landscape, 2:1). JPG / PNG / WEBP · up to 5 MB.
          </p>
        </div>

        {/* Flag image uploader (optional — overrides the emoji) */}
        <div className="mb-4">
          <span className="mb-1.5 block text-sm font-medium text-ero-muted">Flag image (optional — circular flag/badge)</span>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-ero-border bg-ero-bg-2">
              {form.flag_image_url ? (
                <img src={form.flag_image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">
                  {toFlagEmoji(form.flag_emoji)}
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-xl border border-ero-border bg-ero-input px-4 py-2.5 text-sm font-semibold">
                {flagUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {form.flag_image_url ? 'Replace' : 'Upload'} flag
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFlag(e.target.files[0])}
              />
            </label>
            {form.flag_image_url && (
              <Button variant="ghost" className="text-ero-danger" onClick={() => set('flag_image_url')('')}>
                Remove
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-ero-faint">
            Recommended <b>128 × 128 px</b> (square). PNG / WEBP / SVG · up to 5 MB. If no image is set, the flag emoji is used.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name (short)" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="FMGE" />
          {!isEdit && (
            <Input label="Slug (url id)" value={form.slug} onChange={(e) => set('slug')(e.target.value)} placeholder="fmge" />
          )}
          <Input label="Full name" value={form.full_name} onChange={(e) => set('full_name')(e.target.value)} placeholder="Foreign Medical Graduate Examination" />
          <Input label="Country" value={form.country} onChange={(e) => set('country')(e.target.value)} placeholder="India" />
          <Input label="Flag emoji" value={form.flag_emoji} onChange={(e) => set('flag_emoji')(e.target.value)} placeholder="🇮🇳" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ero-muted">Accent color</span>
            <input type="color" value={form.accent_color} onChange={(e) => set('accent_color')(e.target.value)} className="h-11 w-full rounded-xl border border-ero-border bg-ero-input" />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-ero-muted">Description</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            className="w-full rounded-xl border border-ero-border bg-ero-input px-4 py-3 text-ero-text focus:border-ero-primary-400 focus:outline-none"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-ero-muted">Status</span>
          <select
            value={form.status}
            onChange={(e) => set('status')(e.target.value)}
            className="w-full rounded-xl border border-ero-border bg-ero-input px-4 py-3 text-ero-text focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth loading={saving} onClick={save}>{isEdit ? 'Save Changes' : 'Create Programme'}</Button>
        </div>
      </Card>
    </div>
  )
}
