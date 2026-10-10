import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Clock, Layers, ShieldCheck } from 'lucide-react'
import { startAttempt } from '../lib/queries'
import { Button, Card } from '../components/ui'
import type { ApiError } from '../lib/api'

export default function ExamInstructions() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const begin = async () => {
    setLoading(true)
    setError(null)
    try {
      const attempt = await startAttempt(Number(examId))
      navigate(`/app/attempts/${attempt.id}`)
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">Before you begin</h1>

      <Card className="space-y-4">
        <Rule icon={<Layers className="h-5 w-5" />}>
          The exam is organised into timed <b>blocks</b>. Blocks are presented in a
          randomised order generated when your attempt starts, and that order stays
          fixed for this attempt — refreshing won't reshuffle it.
        </Rule>
        <Rule icon={<Clock className="h-5 w-5" />}>
          Each block has its own active timer. The countdown is controlled by the
          server, so it keeps running even if you refresh or briefly lose
          connection. When it reaches zero the block is <b>submitted automatically</b>.
        </Rule>
        <Rule icon={<ShieldCheck className="h-5 w-5" />}>
          Questions and answer options are shuffled per attempt. You can flag
          questions and move freely within the current block. Future blocks unlock
          according to the exam's release schedule.
        </Rule>
        <Rule icon={<AlertTriangle className="h-5 w-5 text-ero-warning" />}>
          Correct answers and explanations are hidden during the mock. Your result
          summary is shown after grading, according to the exam's result policy.
        </Rule>
      </Card>

      {error && (
        <div className="rounded-xl bg-ero-danger/10 px-4 py-3 text-sm text-ero-danger">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={begin} loading={loading} fullWidth>
          Start / Resume Exam
        </Button>
      </div>
    </div>
  )
}

function Rule({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-ero-primary-400">{icon}</div>
      <p className="text-sm text-ero-muted">{children}</p>
    </div>
  )
}
