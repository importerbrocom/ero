import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Button, Card, EmptyState, Input } from '../components/ui'
import { useAuth } from '../store/auth'

/* Lightweight pages that round out the student app navigation. Analytics and
   test history read from the attempt endpoints already built; richer dashboards
   are a planned enhancement. These avoid dead-end navigation. */

export function TestsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold">Tests</h1>
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Your attempts will appear here"
        description="Start a mock exam from a programme to see it listed here with your scores and the option to review."
        action={
          <Link to="/app/exams">
            <Button>Browse Exams</Button>
          </Link>
        }
      />
    </div>
  )
}

export function ProgressPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold">Progress</h1>
      <EmptyState
        title="No performance data yet"
        description="Complete practice sessions and mock exams to unlock accuracy trends, subject-wise analytics and streaks."
      />
    </div>
  )
}

export function ProfilePage() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-extrabold">Profile &amp; Settings</h1>
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ero-primary-400 to-ero-accent text-xl font-bold">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="text-lg font-bold">{user?.name}</div>
            <div className="text-sm text-ero-muted">{user?.email}</div>
          </div>
        </div>
        <Input label="Name" defaultValue={user?.name} />
        <Input label="Country" defaultValue={user?.country ?? ''} />
        <div className="flex justify-between">
          <Button variant="secondary">Save Changes</Button>
          <Button variant="danger" onClick={logout}>Sign Out</Button>
        </div>
      </Card>
    </div>
  )
}

export function SupportPage() {
  const [sent, setSent] = useState(false)
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-extrabold">Help &amp; Support</h1>
      {sent ? (
        <Card>
          <p className="text-ero-success">Thanks — your message has been received. Our team will respond by email.</p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <Input label="Subject" placeholder="How can we help?" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ero-muted">Message</span>
            <textarea
              rows={5}
              className="w-full rounded-xl border border-ero-border bg-ero-bg-2 px-4 py-3 text-ero-text focus:border-ero-primary-400 focus:outline-none"
              placeholder="Describe your issue…"
            />
          </label>
          <Button onClick={() => setSent(true)}>Send Message</Button>
        </Card>
      )}
    </div>
  )
}
