import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Button, Card, Input } from '../components/ui'
import { EroLogo } from '../components/EroLogo'
import type { ApiError } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuth((s) => s.register)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    country: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setErrors({})
    try {
      await register(form)
      navigate('/app')
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message)
      setErrors(apiErr.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ero-bg-2 to-ero-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <EroLogo size="lg" />
          <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-ero-muted">
            Global Exams. Greater Opportunities.
          </p>
        </div>

        <Card>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">
                {error}
              </div>
            )}
            <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name?.[0]} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email?.[0]} required />
            <Input label="Country" value={form.country} onChange={set('country')} placeholder="e.g. India" />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password?.[0]} required />
            <Input
              label="Confirm password"
              type="password"
              value={form.password_confirmation}
              onChange={set('password_confirmation')}
              required
            />
            <Button type="submit" loading={loading} fullWidth>
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ero-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ero-primary-400">
              Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
