import { useEffect, useRef, useState } from 'react'

/**
 * Server-authoritative countdown.
 *
 * The backend is the single source of truth for timers (§5.5). This hook takes
 * the server's `seconds_remaining` and a reference timestamp, then ticks DOWN
 * locally for a smooth display — but it NEVER grants extra time: it computes the
 * remaining time from the delta since the value was received, so changing the
 * device clock has no effect, and the backend re-validates/auto-submits anyway.
 */
export function useServerCountdown(secondsRemaining: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(secondsRemaining)
  const receivedAt = useRef<number>(Date.now())
  const base = useRef<number | null>(secondsRemaining)

  useEffect(() => {
    base.current = secondsRemaining
    receivedAt.current = Date.now()
    setRemaining(secondsRemaining)
  }, [secondsRemaining])

  useEffect(() => {
    if (base.current == null) return
    const tick = () => {
      const elapsed = (Date.now() - receivedAt.current) / 1000
      setRemaining(Math.max(0, Math.round((base.current ?? 0) - elapsed)))
    }
    const id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [secondsRemaining])

  return remaining
}

export function formatClock(totalSeconds: number | null): string {
  if (totalSeconds == null) return '--:--'
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
