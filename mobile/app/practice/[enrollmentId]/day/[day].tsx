import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchPracticeDay, submitPracticeDay } from '../../../../src/lib/queries'
import type { PracticeDay, PracticeQuestion } from '../../../../src/types'
import { Badge, Button, Card } from '../../../../src/components/ui'
import { colors, font, radius, spacing } from '../../../../src/theme'
import type { ApiError } from '../../../../src/lib/api'

export default function PracticeDayScreen() {
  const { enrollmentId, day } = useLocalSearchParams<{ enrollmentId: string; day: string }>()
  const router = useRouter()
  const [data, setData] = useState<PracticeDay | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPracticeDay(Number(enrollmentId), Number(day))
      .then((d) => {
        setData(d)
        const pre: Record<number, number> = {}
        d.questions.forEach((q) => { if (q.selected_option_id) pre[q.question_id] = q.selected_option_id })
        setAnswers(pre)
      })
      .catch((e) => setError((e as ApiError).message))
  }, [enrollmentId, day])

  if (error) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4) }}><Text style={{ color: colors.danger }}>{error}</Text></SafeAreaView>
  }
  if (!data) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary400} /></View>
  }

  const completed = data.status === 'completed'
  const q = data.questions[current]

  const pick = (optionId: number) => {
    if (completed) return
    setAnswers((a) => ({ ...a, [q.question_id]: optionId }))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitPracticeDay(Number(enrollmentId), data.id, answers)
      setData(res.data)
      setCurrent(0)
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: `Day ${data.day_number}`, headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(2) }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Question {current + 1} of {data.questions.length}</Text>
        {completed ? <Text style={{ color: colors.success, fontSize: font.xs }}>Completed — reviewing · {data.accuracy}%</Text> : null}
        <View style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.bg2, marginTop: spacing(2), overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${((current + 1) / data.questions.length) * 100}%`, backgroundColor: colors.primary }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <QuestionCard q={q} selectedId={answers[q.question_id] ?? null} completed={completed} onPick={pick} />
        {error ? <Text style={{ color: colors.danger, marginTop: spacing(2) }}>{error}</Text> : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing(2), padding: spacing(4), borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button label="← Prev" variant="secondary" disabled={current === 0} onPress={() => setCurrent((c) => c - 1)} style={{ flex: 1 }} />
        {current < data.questions.length - 1 ? (
          <Button label="Next →" onPress={() => setCurrent((c) => c + 1)} style={{ flex: 1 }} />
        ) : completed ? (
          <Button label="Finish" onPress={() => router.replace(`/practice/${enrollmentId}`)} style={{ flex: 1 }} />
        ) : (
          <Button label="Submit Day" variant="success" loading={submitting} onPress={submit} style={{ flex: 1 }} />
        )}
      </View>
    </SafeAreaView>
  )
}

function QuestionCard({ q, selectedId, completed, onPick }: {
  q: PracticeQuestion
  selectedId: number | null
  completed: boolean
  onPick: (id: number) => void
}) {
  const correctId = useMemo(() => q.options.find((o) => o.is_correct)?.id ?? null, [q])
  const isCorrect = completed && selectedId != null && selectedId === correctId

  return (
    <Card>
      {q.subject ? <View style={{ marginBottom: spacing(2) }}><Badge label={q.subject} /></View> : null}
      <Text style={{ color: colors.text, fontSize: font.base, lineHeight: 22, marginBottom: spacing(3) }}>{q.stem}</Text>

      {q.options.map((opt) => {
        const selected = selectedId === opt.id
        let borderColor = colors.border
        let bg: string = 'transparent'
        if (completed) {
          if (opt.is_correct) { borderColor = colors.success; bg = 'rgba(34,197,94,0.1)' }
          else if (selected) { borderColor = colors.danger; bg = 'rgba(239,68,68,0.1)' }
        } else if (selected) { borderColor = colors.primary; bg = 'rgba(37,99,235,0.1)' }

        return (
          <Pressable
            key={opt.id}
            onPress={() => onPick(opt.id)}
            disabled={completed}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), borderWidth: 1, borderColor, backgroundColor: bg, borderRadius: radius.lg, padding: spacing(3), marginBottom: spacing(2) }}
          >
            <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: completed && opt.is_correct ? colors.success : selected ? colors.primary : colors.border, backgroundColor: completed && opt.is_correct ? colors.success : selected ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: (completed && opt.is_correct) || selected ? colors.white : colors.muted, fontWeight: '800', fontSize: font.sm }}>{opt.letter}</Text>
            </View>
            <Text style={{ color: colors.text, flex: 1 }}>{opt.text}</Text>
          </Pressable>
        )
      })}

      {completed ? (
        <View style={{ marginTop: spacing(2) }}>
          <View style={{ backgroundColor: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: radius.lg, padding: spacing(3), marginBottom: spacing(2) }}>
            <Text style={{ color: isCorrect ? colors.success : colors.danger, fontWeight: '700' }}>
              {isCorrect ? '✓ Correct!' : selectedId == null ? 'Not answered' : '✗ Incorrect'}
            </Text>
          </View>
          {q.explanation ? (
            <View style={{ backgroundColor: colors.bg2, borderRadius: radius.lg, padding: spacing(3), marginBottom: spacing(2) }}>
              <Text style={{ color: colors.primary400, fontWeight: '700', marginBottom: 4 }}>📖 Explanation</Text>
              <Text style={{ color: colors.muted }}>{q.explanation}</Text>
            </View>
          ) : null}
          {q.key_points && q.key_points.length > 0 ? (
            <View style={{ backgroundColor: colors.bg2, borderRadius: radius.lg, padding: spacing(3), marginBottom: spacing(2) }}>
              <Text style={{ color: colors.warning, fontWeight: '700', marginBottom: 4 }}>💡 Key Points</Text>
              {q.key_points.map((kp, i) => (
                <Text key={i} style={{ color: colors.muted, marginBottom: 2 }}>• {kp}</Text>
              ))}
            </View>
          ) : null}
          {q.high_yield_fact ? (
            <View style={{ backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: radius.lg, padding: spacing(3) }}>
              <Text style={{ color: colors.accent, fontWeight: '700', marginBottom: 4 }}>✨ High-Yield Fact</Text>
              <Text style={{ color: colors.muted }}>{q.high_yield_fact}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}
