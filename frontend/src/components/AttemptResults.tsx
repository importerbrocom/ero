import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Attempt } from '../types'
import { Button, Card, KpiChip, ProgressRing } from './ui'

export function AttemptResults({ attempt, onDone }: { attempt: Attempt; onDone: () => void }) {
  const r = attempt.result
  if (!r) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-ero-muted">Grading in progress…</p>
      </Card>
    )
  }

  const accuracy = Number(r.accuracy)
  const subjectData = Object.entries(r.subject_breakdown ?? {}).map(([name, v]) => ({
    name,
    accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-ero-primary-600 to-ero-accent p-6 text-center">
        <p className="text-sm font-medium text-white/80">Examination complete</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">{attempt.exam.title}</h1>
        {attempt.status === 'expired' && (
          <p className="mt-1 text-sm text-white/80">Some blocks closed on the timer.</p>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-4">
          <div className="flex justify-center">
            <ProgressRing value={accuracy} size={92} label="Accuracy" />
          </div>
          <KpiChip icon={<span className="text-xl">📝</span>} value={r.total_questions} label="Questions" />
          <KpiChip icon={<CheckCircle2 className="h-6 w-6" />} value={r.correct_count} label="Correct" tone="success" />
          <KpiChip icon={<XCircle className="h-6 w-6" />} value={r.incorrect_count} label="Incorrect" tone="danger" />
        </div>
      </Card>

      {subjectData.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Subject-wise accuracy</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
                <XAxis dataKey="name" tick={{ fill: '#93a3c0', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fill: '#93a3c0', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f1a30', border: '1px solid #1e2d4d', borderRadius: 12 }}
                  labelStyle={{ color: '#e8eefc' }}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {subjectData.map((d, i) => (
                    <Cell key={i} fill={d.accuracy >= 70 ? '#22c55e' : d.accuracy >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onDone}>Back to Tests</Button>
      </div>
    </div>
  )
}
