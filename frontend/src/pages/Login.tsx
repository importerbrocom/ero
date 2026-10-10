import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../store/auth'
import { Button, Card, Input } from '../components/ui'
import { EroLogo } from '../components/EroLogo'
import type { ApiError } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const [email, setEmail] = useState('student@ero.test')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/app')
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
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-ero-muted">
            Sign in to continue your medical exam preparation.
          </p>
        </div>

        <Card className="space-y-4">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} fullWidth>
              <Mail className="h-4 w-4" />
              Sign In with Email
            </Button>
            <p className="text-right text-sm">
              <Link to="/forgot-password" className="text-ero-muted hover:text-ero-primary-400">
                Forgot password?
              </Link>
            </p>
          </form>
          <p className="text-center text-sm text-ero-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-ero-primary-400">
              Create Account
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-ero-faint">
          Demo accounts — student@ero.test / admin@ero.test / super@ero.test ·
          password: <span className="font-mono">password</span>
        </p>
      </div>
    </div>
  )
}
