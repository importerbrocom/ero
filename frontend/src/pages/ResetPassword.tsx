import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, type ApiError } from '../lib/api'
import { Button, Card, Input } from '../components/ui'
import { EroLogo } from '../components/EroLogo'

/**
 * Target of the reset link: /reset-password?token=...&email=...
 * (The backend's ResetPassword notification builds a link to the frontend;
 * configure that URL via APP_FRONTEND_URL / the notification's toMail.)
 */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const emailParam = params.get('email') ?? ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setErrors({})
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirm,
      })
      navigate('/login', { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
      setErrors(apiErr.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ero-bg-2 to-ero-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <EroLogo size="lg" />
          <h1 className="mt-6 text-2xl font-bold">Choose a new password</h1>
        </div>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">{error}</div>
            )}
            {!token && (
              <div className="rounded-xl bg-ero-warning/10 px-4 py-3 text-sm text-ero-warning">
                This page expects a reset token from your email link.
              </div>
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email?.[0]} required />
            <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password?.[0]} required />
            <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <Button type="submit" loading={loading} fullWidth>Reset password</Button>
          </form>
          <p className="mt-4 text-center text-sm text-ero-muted">
            <Link to="/login" className="font-semibold text-ero-primary-400">Back to sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
