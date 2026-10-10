import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { api, type ApiError } from '../lib/api'
import { Button, Card, Input } from '../components/ui'
import { EroLogo } from '../components/EroLogo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setMessage(data.message)
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ero-bg-2 to-ero-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <EroLogo size="lg" />
          <h1 className="mt-6 text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-ero-muted">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <Card className="space-y-4">
          {message ? (
            <div className="rounded-xl bg-ero-success/10 px-4 py-3 text-sm text-ero-success">
              {message}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">{error}</div>
              )}
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" loading={loading} fullWidth>
                <Mail className="h-4 w-4" /> Send reset link
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-ero-muted">
            <Link to="/login" className="font-semibold text-ero-primary-400">Back to sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
