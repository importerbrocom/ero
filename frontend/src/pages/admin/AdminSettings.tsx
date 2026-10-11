import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, Save } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import { Button, Card } from '../../components/ui'
import type { ApiError } from '../../lib/api'

export default function AdminSettings() {
  const [bannerUrl, setBannerUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    adminApi.getSettings()
      .then((s) => setBannerUrl(s.welcome_banner_url ?? ''))
      .finally(() => setLoading(false))
  }, [])

  const upload = async (file: File) => {
    setUploading(true)
    setMsg(null)
    try {
      const res = await adminApi.uploadImage(file, 'banners')
      setBannerUrl(res.url)
    } catch (e) {
      setMsg({ text: (e as ApiError).message, ok: false })
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await adminApi.updateSettings({ welcome_banner_url: bannerUrl || null })
      setMsg({ text: 'Settings saved.', ok: true })
    } catch (e) {
      setMsg({ text: (e as ApiError).message, ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <Card className="space-y-4">
        <div>
          <h2 className="font-bold">Student Welcome Banner</h2>
          <p className="text-sm text-ero-muted">
            This image appears behind the "Welcome Back" hero on the student dashboard.
          </p>
        </div>

        {/* Live preview matching the student hero */}
        <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-ero-border ero-grad-hero">
          {bannerUrl && (
            <>
              <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-ero-bg/90 via-ero-bg/40 to-transparent" />
            </>
          )}
          <div className="relative z-10 p-5">
            <div className="text-xl font-extrabold text-white">Welcome Back!</div>
            <div className="text-sm text-ero-muted">Let's continue your preparation</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-xl border border-ero-border bg-ero-input px-4 py-2.5 text-sm font-semibold">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {bannerUrl ? 'Replace' : 'Upload'} banner
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          {bannerUrl && (
            <Button variant="ghost" className="text-ero-danger" onClick={() => setBannerUrl('')}>
              Remove
            </Button>
          )}
        </div>

        {msg && (
          <p className={`text-sm ${msg.ok ? 'text-ero-success' : 'text-ero-danger'}`}>{msg.text}</p>
        )}

        <Button onClick={save} loading={saving} disabled={loading}>
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </Card>
    </div>
  )
}
