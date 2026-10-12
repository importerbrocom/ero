import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Search, Unlock } from 'lucide-react'
import { fetchProgrammes, redeemCode } from '../lib/queries'
import type { Programme } from '../types'
import { Badge, Button, Card, FlagMark, Input, Skeleton } from '../components/ui'
import type { ApiError } from '../lib/api'

export default function ChooseExam() {
  const [programmes, setProgrammes] = useState<Programme[] | null>(null)
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const [redeemState, setRedeemState] = useState<{ msg: string; ok: boolean } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  const load = () => fetchProgrammes().then(setProgrammes)

  useEffect(() => {
    load()
  }, [])

  const doRedeem = async () => {
    if (!code.trim()) return
    setRedeeming(true)
    setRedeemState(null)
    try {
      const res = await redeemCode(code.trim())
      setRedeemState({ msg: res.message, ok: true })
      setCode('')
      await load()
    } catch (err) {
      setRedeemState({ msg: (err as ApiError).message, ok: false })
    } finally {
      setRedeeming(false)
    }
  }

  const filtered = programmes?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.full_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Choose Your Exam</h1>
        <p className="mt-1 text-ero-muted">
          One platform. Multiple global exams. Practice. Learn. Track. Succeed.
        </p>
      </div>

      {/* Activation code redemption */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Have an activation code?"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code to unlock a programme"
          />
        </div>
        <Button onClick={doRedeem} loading={redeeming} variant="secondary">
          <Unlock className="h-4 w-4" /> Redeem
        </Button>
      </Card>
      {redeemState && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            redeemState.ok ? 'bg-ero-success/10 text-ero-success' : 'bg-ero-danger/10 text-ero-danger'
          }`}
        >
          {redeemState.msg}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ero-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exams..."
          className="w-full rounded-xl border border-ero-border bg-ero-bg-2 py-3 pl-11 pr-4 text-ero-text placeholder:text-ero-faint focus:border-ero-primary-400 focus:outline-none"
        />
      </div>

      {!programmes && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered?.map((p) => (
          <Link key={p.id} to={`/app/programmes/${p.slug}`} className="block">
            <div
              className="group relative overflow-hidden rounded-2xl border border-ero-border p-4 transition-transform hover:-translate-y-0.5"
              style={{
                backgroundImage: `linear-gradient(120deg, ${p.accent_color}24 0%, var(--color-ero-card) 62%)`,
              }}
            >
              {/* Landmark image slot (left), shown when the admin set a cover image */}
              {p.cover_image_url && (
                <div className="pointer-events-none absolute inset-y-0 left-0 w-44">
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                  {/* slim right-edge blend only, so the landmark stays clear */}
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-ero-card" />
                </div>
              )}
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.accent_color }} />
              <div className={`relative flex items-start justify-between gap-3 ${p.cover_image_url ? 'pl-40' : ''}`}>
                <div className="flex items-center gap-3">
                  <FlagMark imageUrl={p.flag_image_url} emoji={p.flag_emoji} size={34} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      {p.has_access ? (
                        <Badge tone="success">Unlocked</Badge>
                      ) : (
                        <Badge tone="locked">
                          <Lock className="h-3 w-3" /> Locked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-ero-muted">{p.full_name}</p>
                    <p className="mt-1 text-xs text-ero-faint">
                      {p.question_count.toLocaleString()} questions · {p.country}
                    </p>
                  </div>
                </div>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: p.accent_color }}
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
