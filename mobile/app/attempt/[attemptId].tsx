import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  fetchAttempt,
  fetchBlockQuestions,
  saveAnswer,
  startBlock,
  submitBlock,
} from '../../src/lib/queries'
import type { Attempt, AttemptBlock, ExamQuestion } from '../../src/types'
import { Badge, Button, Card, AccuracyRing } from '../../src/components/ui'
import { formatClock, useServerCountdown } from '../../src/hooks/useServerCountdown'
import { colors, font, radius, spacing } from '../../src/theme'

export default function AttemptScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>()
  const router = useRouter()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [activeBlock, setActiveBlock] = useState<AttemptBlock | null>(null)

  const refresh = useCallback(async () => {
    const a = await fetchAttempt(Number(attemptId))
    setAttempt(a)
    return a
  }, [attemptId])

  useEffect(() => { refresh() }, [refresh])

  if (!attempt) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary400} /></View>
  }

  if (attempt.status === 'completed' || attempt.status === 'expired') {
    return <Results attempt={attempt} onDone={() => router.replace('/(tabs)/tests')} />
  }

  if (activeBlock) {
    return (
      <BlockInterface
        attempt={attempt}
        blockId={activeBlock.id}
        onExit={async () => { await refresh(); setActiveBlock(null) }}
      />
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: 'Mock Exam', headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <Text style={{ color: colors.text, fontSize: font.xl, fontWeight: '800' }}>{attempt.exam.title}</Text>
        <Text style={{ color: colors.muted, marginBottom: spacing(4) }}>
          {attempt.exam.block_count} blocks · {attempt.exam.questions_per_block} questions each · {attempt.exam.block_duration_minutes} min/block
        </Text>
        {attempt.blocks.map((b) => (
          <BlockRow
            key={b.id}
            block={b}
            onEnter={async () => { await startBlock(attempt.id, b.id); setActiveBlock(b) }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function BlockRow({ block, onEnter }: { block: AttemptBlock; onEnter: () => Promise<void> }) {
  const release = useServerCountdown(block.seconds_until_available)
  const active = useServerCountdown(block.seconds_remaining)
  const [busy, setBusy] = useState(false)

  const badge = {
    locked: <Badge label="Locked" tone="locked" />,
    available: <Badge label="Available" />,
    in_progress: <Badge label="In progress" tone="warning" />,
    submitted: <Badge label="Submitted" tone="success" />,
    expired: <Badge label="Expired" tone="danger" />,
  }[block.status]

  const enter = async () => { setBusy(true); try { await onEnter() } finally { setBusy(false) } }

  return (
    <Card style={{ marginBottom: spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), flex: 1 }}>
        <View style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{block.display_position}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Block {block.display_position}</Text>
            {badge}
          </View>
          <Text style={{ color: colors.muted, fontSize: font.xs }}>
            {block.answered_count}/{block.question_count} answered
            {block.status === 'in_progress' && active != null ? ` · ${formatClock(active)} left` : ''}
            {block.status === 'locked' && release != null && release > 0 ? ` · unlocks in ${formatClock(release)}` : ''}
          </Text>
        </View>
      </View>
      {(block.status === 'available' || block.status === 'in_progress') && (
        <Button
          label={block.status === 'in_progress' ? 'Resume' : 'Start'}
          loading={busy}
          style={{ paddingVertical: 8, paddingHorizontal: 14 }}
          onPress={enter}
        />
      )}
    </Card>
  )
}

function BlockInterface({ attempt, blockId, onExit }: { attempt: Attempt; blockId: number; onExit: () => void }) {
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [block, setBlock] = useState<AttemptBlock | null>(null)
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const load = useCallback(async () => {
    const data = await fetchBlockQuestions(attempt.id, blockId)
    setQuestions(data.questions)
    setBlock(data.block as AttemptBlock)
  }, [attempt.id, blockId])

  useEffect(() => { load() }, [load])

  const countdown = useServerCountdown(block?.seconds_remaining ?? null)

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try { await submitBlock(attempt.id, blockId) } finally { onExit() }
  }, [attempt.id, blockId, onExit])

  useEffect(() => {
    if (countdown === 0 && !submittedRef.current) doSubmit()
  }, [countdown, doSubmit])

  if (!questions || !block) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary400} /></View>
  }

  const q = questions[current]
  const answered = questions.filter((x) => x.selected_option_id != null).length

  const pick = async (optionId: number) => {
    setQuestions((prev) => prev!.map((x) => x.attempt_question_id === q.attempt_question_id ? { ...x, selected_option_id: optionId } : x))
    try {
      await saveAnswer(attempt.id, blockId, { attempt_question_id: q.attempt_question_id, selected_option_id: optionId, flagged: q.is_flagged })
    } catch { doSubmit() }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: spacing(4), paddingBottom: spacing(2) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>
            Block {block.display_position} · Q{current + 1}/{questions.length}
          </Text>
          <View style={{ backgroundColor: (countdown ?? 0) < 60 ? 'rgba(239,68,68,0.15)' : colors.bg2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md }}>
            <Text style={{ color: (countdown ?? 0) < 60 ? colors.danger : colors.text, fontWeight: '800' }}>⏱ {formatClock(countdown)}</Text>
          </View>
        </View>
        <View style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.bg2, marginTop: spacing(2), overflow: 'hidden' }}>
          <View style={{ height: 6, width: `${((current + 1) / questions.length) * 100}%`, backgroundColor: colors.primary }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingTop: 0 }}>
        <Card>
          {q.subject ? <View style={{ marginBottom: spacing(2) }}><Badge label={q.subject} /></View> : null}
          <Text style={{ color: colors.text, fontSize: font.base, lineHeight: 22, marginBottom: spacing(3) }}>{q.stem}</Text>
          {q.options.map((opt) => {
            const selected = q.selected_option_id === opt.id
            return (
              <Pressable
                key={opt.id}
                onPress={() => pick(opt.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(3),
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? 'rgba(37,99,235,0.1)' : 'transparent',
                  borderRadius: radius.lg,
                  padding: spacing(3),
                  marginBottom: spacing(2),
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: selected ? colors.white : colors.muted, fontWeight: '800', fontSize: font.sm }}>{opt.letter}</Text>
                </View>
                <Text style={{ color: colors.text, flex: 1 }}>{opt.text}</Text>
              </Pressable>
            )
          })}
        </Card>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing(2), padding: spacing(4), borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button label="← Prev" variant="secondary" disabled={current === 0} onPress={() => setCurrent((c) => c - 1)} style={{ flex: 1 }} />
        {current < questions.length - 1 ? (
          <Button label="Next →" onPress={() => setCurrent((c) => c + 1)} style={{ flex: 1 }} />
        ) : (
          <Button label={`Submit (${answered}/${questions.length})`} variant="success" loading={submitting} onPress={doSubmit} style={{ flex: 1 }} />
        )}
      </View>
    </SafeAreaView>
  )
}

function Results({ attempt, onDone }: { attempt: Attempt; onDone: () => void }) {
  const r = attempt.result
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <View style={{ borderRadius: radius.xl, backgroundColor: colors.primary, padding: spacing(5), alignItems: 'center', marginBottom: spacing(4) }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Examination complete</Text>
          <Text style={{ color: colors.white, fontSize: font.xl, fontWeight: '800', marginTop: 4, textAlign: 'center' }}>{attempt.exam.title}</Text>
        </View>
        {r ? (
          <Card style={{ alignItems: 'center' }}>
            <AccuracyRing value={Number(r.accuracy)} size={100} />
            <View style={{ flexDirection: 'row', gap: spacing(5), marginTop: spacing(4) }}>
              <Stat label="Correct" value={r.correct_count} color={colors.success} />
              <Stat label="Incorrect" value={r.incorrect_count} color={colors.danger} />
              <Stat label="Total" value={r.total_questions} color={colors.text} />
            </View>
          </Card>
        ) : (
          <Card><Text style={{ color: colors.muted }}>Grading in progress…</Text></Card>
        )}
        <Button label="Back to Tests" onPress={onDone} style={{ marginTop: spacing(4) }} fullWidth />
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color, fontSize: font.xl, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: font.xs }}>{label}</Text>
    </View>
  )
}
