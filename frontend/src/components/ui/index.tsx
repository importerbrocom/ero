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
      'bg-ero-primary hover:bg-ero-primary-600 text-white shadow-lg shadow-ero-primary/20',
    secondary:
      'bg-ero-surface border border-ero-border hover:border-ero-primary-400 text-ero-text',
    ghost: 'bg-transparent hover:bg-white/5 text-ero-muted hover:text-ero-text',
    danger: 'bg-ero-danger hover:bg-red-600 text-white',
    success: 'bg-ero-success hover:bg-green-600 text-white',
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
        'rounded-2xl border border-ero-border bg-ero-surface-2 p-5',
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
          'w-full rounded-xl border bg-ero-bg-2 px-4 py-3 text-ero-text placeholder:text-ero-faint',
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
    <div className="flex gap-2 overflow-x-auto rounded-xl bg-ero-bg-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            active === t.key
              ? 'bg-ero-primary text-white'
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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2d4d" strokeWidth={stroke} fill="none" />
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
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#7c3aed" />
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
