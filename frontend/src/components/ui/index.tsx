import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/* ----------------------------------------------------------------------------
   ERO design-system primitives — reusable, accessible components derived from
   the screenshots (dark cards, blue primary, pill tabs, KPI chips, etc.).
---------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      'ero-grad-primary ero-glow-primary hover:brightness-110 text-white',
    secondary:
      'bg-ero-input border border-ero-border hover:border-ero-primary-400 text-ero-text',
    ghost: 'bg-transparent hover:bg-white/5 text-ero-muted hover:text-ero-text',
    danger: 'bg-ero-danger hover:brightness-110 text-white',
    success: 'ero-grad-success hover:brightness-110 text-[#042b22]',
  }
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ero-primary-400/50',
        fullWidth && 'w-full',
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-ero-border bg-ero-card p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.5)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ero-muted">
          {label}
        </span>
      )}
      <input
        id={id}
        className={clsx(
          'w-full rounded-xl border bg-ero-input px-4 py-3 text-ero-text placeholder:text-ero-faint',
          'focus:outline-none focus:ring-2 focus:ring-ero-primary-400/50',
          error ? 'border-ero-danger' : 'border-ero-border focus:border-ero-primary-400',
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-ero-danger">{error}</span>}
    </label>
  )
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border border-ero-border bg-ero-bg-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            active === t.key
              ? 'ero-grad-primary text-white'
              : 'text-ero-muted hover:text-ero-text',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function KpiChip({
  icon,
  value,
  label,
  tone = 'default',
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  tone?: 'default' | 'success' | 'danger' | 'streak'
}) {
  const tones = {
    default: 'text-ero-primary-400',
    success: 'text-ero-success',
    danger: 'text-ero-danger',
    streak: 'text-ero-streak',
  }
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={clsx('shrink-0', tones[tone])}>{icon}</div>
      <div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-ero-muted">{label}</div>
      </div>
    </Card>
  )
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'locked'
}) {
  const tones = {
    default: 'bg-ero-primary/15 text-ero-primary-400',
    success: 'bg-ero-success/15 text-ero-success',
    danger: 'bg-ero-danger/15 text-ero-danger',
    warning: 'bg-ero-warning/15 text-ero-warning',
    locked: 'bg-white/5 text-ero-faint',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('ero-skeleton rounded-xl', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ero-border px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ero-faint">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-ero-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ProgressRing({
  value,
  size = 72,
  label,
}: {
  value: number
  size?: number
  label?: string
}) {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#13335c" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ero-ring)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ero-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1678ff" />
            <stop offset="100%" stopColor="#12e6a5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold">{Math.round(value)}%</span>
        {label && <span className="text-[10px] text-ero-muted">{label}</span>}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   Screenshot-matched building blocks: hero banners, exam cards, subject tiles,
   stat cards. Image slots are swappable: pass `image` (a URL) to drop in real
   landmark/medical photography; otherwise a themed gradient fills the slot.
---------------------------------------------------------------------------- */

/** Wide, shallow hero banner with a thin blue border (dashboard / FMGE / mock). */
export function HeroBanner({
  variant = 'hero',
  eyebrow,
  title,
  subtitle,
  image,
  coverImage = false,
  children,
  className,
}: {
  variant?: 'hero' | 'mock' | 'primary'
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  image?: string
  /** When true, the image covers the FULL banner (background) instead of the
   *  right-half slot. A left→right dark gradient keeps the text readable. */
  coverImage?: boolean
  children?: ReactNode
  className?: string
}) {
  const grad =
    variant === 'mock' ? 'ero-grad-mock' : variant === 'primary' ? 'ero-grad-primary' : 'ero-grad-hero'
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-ero-border',
        grad,
        className,
      )}
    >
      {/* Image slot. Full-cover background (coverImage) or right-half slot. */}
      {image && coverImage && (
        <div className="pointer-events-none absolute inset-0">
          <img src={image} alt="" className="h-full w-full object-cover" />
          {/* Readability gradient: strong on the left (behind text), clear on the right. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ero-bg/95 via-ero-bg/70 to-ero-bg/25" />
        </div>
      )}
      {image && !coverImage && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
          <img src={image} alt="" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-ero-bg/90 via-ero-bg/30 to-transparent" />
        </div>
      )}
      <div className={clsx('relative z-10 p-6', coverImage ? 'max-w-[65%]' : 'max-w-[70%]')}>
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-ero-muted">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ero-muted">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}

/** Large exam card (Choose Your Exam) — flag + landmark slot + accent + arrow. */
export function ExamCard({
  flag,
  name,
  fullName,
  meta,
  accent = '#086BFF',
  image,
  onClick,
}: {
  flag?: ReactNode
  name: string
  fullName: string
  meta?: ReactNode
  accent?: string
  image?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-ero-border text-left transition-transform hover:-translate-y-0.5"
      style={{
        backgroundImage: `linear-gradient(120deg, ${accent}1f 0%, var(--color-ero-card) 60%)`,
      }}
    >
      {/* accent top edge */}
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      {image && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28">
          <img src={image} alt="" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ero-card" />
        </div>
      )}
      <div className={clsx('relative flex items-center justify-between gap-3 p-4', image && 'pl-32')}>
        <div className="flex items-center gap-3">
          {flag && <div className="text-2xl leading-none">{flag}</div>}
          <div>
            <div className="font-bold text-white">{name}</div>
            <div className="text-xs text-ero-muted">{fullName}</div>
            {meta && <div className="mt-1 text-[11px] text-ero-faint">{meta}</div>}
          </div>
        </div>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: accent }}
        >
          →
        </span>
      </div>
    </button>
  )
}

/** Colored rounded-square subject tile (icon + name + question count). */
export function SubjectTile({
  icon,
  name,
  count,
  color = '#086BFF',
  onClick,
}: {
  icon: ReactNode
  name: string
  count: ReactNode
  color?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-ero-border bg-ero-card p-3 text-left transition-colors hover:border-ero-primary-400"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: color }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="text-xs text-ero-muted">{count}</div>
      </div>
    </button>
  )
}

/** Compact stat card (accuracy / answered / correct / incorrect / streak). */
export function StatCard({
  icon,
  value,
  label,
  tone = 'default',
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  tone?: 'default' | 'success' | 'danger' | 'cyan' | 'streak' | 'purple'
}) {
  const tones: Record<string, string> = {
    default: 'text-ero-primary-400',
    success: 'text-ero-success',
    danger: 'text-ero-danger',
    cyan: 'text-ero-cyan',
    streak: 'text-ero-streak',
    purple: 'text-ero-accent',
  }
  return (
    <Card className="p-4">
      <div className={clsx('mb-2', tones[tone])}>{icon}</div>
      <div className="text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-xs text-ero-muted">{label}</div>
    </Card>
  )
}

/**
 * Convert a value stored in `flag_emoji` into a displayable flag.
 * - If it's already an emoji (🇮🇳), return as-is.
 * - If it's a 2-letter ISO country code ("IN", "us"), convert to the regional-
 *   indicator flag emoji (🇮🇳). This fixes data stored as plain "IN"/"US".
 */
export function toFlagEmoji(value?: string | null): string {
  if (!value) return '🎓'
  const v = value.trim()
  // Already contains an emoji / non-ASCII glyph → use it directly.
  // eslint-disable-next-line no-control-regex
  if (/[^\u0000-\u007F]/.test(v)) return v
  // Plain 2-letter code → regional indicator symbols.
  if (/^[A-Za-z]{2}$/.test(v)) {
    const cc = v.toUpperCase()
    return String.fromCodePoint(
      0x1f1e6 + (cc.charCodeAt(0) - 65),
      0x1f1e6 + (cc.charCodeAt(1) - 65),
    )
  }
  return v
}

/** Programme flag: circular uploaded image if present, else the (coerced) emoji. */
export function FlagMark({
  imageUrl,
  emoji,
  size = 28,
}: {
  imageUrl?: string | null
  emoji?: string | null
  size?: number
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{toFlagEmoji(emoji)}</span>
}
