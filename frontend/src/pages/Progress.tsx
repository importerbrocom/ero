import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CheckCircle2, XCircle, Flame, Clock, ClipboardList } from 'lucide-react'
import { fetchAnalytics } from '../lib/queries'
import type { AnalyticsOverview } from '../types'
import { Button, Card, EmptyState, ProgressRing, Skeleton, StatCard } from '../components/ui'

export default function Progress() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <Card><p className="text-ero-danger">{error}</p></Card>

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data.has_activity) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-extrabold">Progress</h1>
        <EmptyState
          title="No performance data yet"
          description="Complete a daily practice session or a mock exam to unlock accuracy trends, subject-wise analytics and streaks."
          action={<Link to="/app/exams"><Button>Start practising</Button></Link>}
        />
      </div>
    )
  }

  const trend = data.accuracy_trend.map((t, i) => ({ ...t, idx: i + 1 }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-extrabold">Progress</h1>

      {/* KPI row (screenshot 11) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex flex-col items-center justify-center">
          <ProgressRing value={data.overall_accuracy} size={84} label="Accuracy" />
        </Card>
        <StatCard icon={<ClipboardList className="h-6 w-6" />} value={data.questions_attempted} label="Questions Attempted" />
        <StatCard icon={<CheckCircle2 className="h-6 w-6" />} value={data.correct} label="Correct" tone="success" />
        <StatCard icon={<XCircle className="h-6 w-6" />} value={data.incorrect} label="Incorrect" tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<Clock className="h-6 w-6" />} value={data.current_streak} label="Day Streak" tone="streak" />
        <StatCard icon={<Flame className="h-6 w-6" />} value={data.best_streak} label="Best Streak" tone="streak" />
        <StatCard icon={<Clock className="h-6 w-6" />} value={data.mock_attempts} label="Mock Attempts" tone="purple" />
      </div>

      {/* Accuracy trend */}
      {trend.length > 1 && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Accuracy Trend</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ero-trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1678ff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#1678ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#193d68" />
                <XAxis dataKey="label" tick={{ fill: '#8398bb', fontSize: 11 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#8398bb', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0b2341', border: '1px solid #193d68', borderRadius: 12 }}
                  labelStyle={{ color: '#f5f7ff' }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#1678ff" strokeWidth={2} fill="url(#ero-trend)" dot={{ fill: '#168bff', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Subject-wise accuracy */}
      {data.subject_accuracy.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Subject-wise Accuracy</h2>
          <div className="space-y-3">
            {data.subject_accuracy.map((s) => (
              <div key={s.subject}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-ero-muted">{s.accuracy}% · {s.correct}/{s.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ero-bg-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.accuracy}%`,
                      background: s.accuracy >= 70 ? '#12e6a5' : s.accuracy >= 50 ? '#ffb72c' : '#ff416d',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mock test performance */}
      {data.mock_scores.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-bold">Mock Test Performance</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mock_scores.map((m, i) => ({ ...m, label: `#${i + 1}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#193d68" />
                <XAxis dataKey="label" tick={{ fill: '#8398bb', fontSize: 11 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#8398bb', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0b2341', border: '1px solid #193d68', borderRadius: 12 }}
                  labelStyle={{ color: '#f5f7ff' }}
                  formatter={(v) => [`${v}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {data.mock_scores.map((m, i) => (
                    <Cell key={i} fill={m.accuracy >= 70 ? '#12e6a5' : m.accuracy >= 50 ? '#ffb72c' : '#ff416d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}
