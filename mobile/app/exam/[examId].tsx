import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { enrollPractice, startAttempt } from '../../src/lib/queries'
import { Button, Card } from '../../src/components/ui'
import { colors, font, spacing } from '../../src/theme'
import type { ApiError } from '../../src/lib/api'

/**
 * Entry point for an exam. For a mock it shows instructions then starts/resumes
 * an attempt; for daily practice it enrolls and routes to the practice plan.
 */
export default function ExamEntry() {
  const { examId, mode } = useLocalSearchParams<{ examId: string; mode?: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isPractice = mode === 'practice'

  useEffect(() => {
    if (!isPractice) return
    // Practice: enroll immediately and jump to the plan.
    setLoading(true)
    enrollPractice(Number(examId))
      .then((plan) => router.replace(`/practice/${plan.enrollment_id}`))
      .catch((e) => setError((e as ApiError).message))
      .finally(() => setLoading(false))
  }, [examId, isPractice, router])

  const beginMock = async () => {
    setLoading(true)
    setError(null)
    try {
      const attempt = await startAttempt(Number(examId))
      router.replace(`/attempt/${attempt.id}`)
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  if (isPractice) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        {error ? <Text style={{ color: colors.danger, padding: spacing(4) }}>{error}</Text> : <ActivityIndicator color={colors.primary400} />}
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: 'Mock Exam', headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <Text style={{ color: colors.text, fontSize: font.xl, fontWeight: '800', marginBottom: spacing(4) }}>
          Before you begin
        </Text>
        <Card>
          {[
            'Blocks are presented in a randomised order generated for your attempt — refreshing won\'t reshuffle it.',
            'Each block has its own timer, controlled by the server. It keeps running if you close the app, and auto-submits at zero.',
            'Questions and options are shuffled per attempt. You can flag questions and move freely within the current block.',
            'Correct answers and explanations stay hidden during the mock; your result summary appears after grading.',
          ].map((rule, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) }}>
              <Text style={{ color: colors.primary400, fontWeight: '800' }}>•</Text>
              <Text style={{ color: colors.muted, flex: 1 }}>{rule}</Text>
            </View>
          ))}
        </Card>

        {error ? <Text style={{ color: colors.danger, marginTop: spacing(3) }}>{error}</Text> : null}

        <Button label="Start / Resume Exam" onPress={beginMock} loading={loading} fullWidth style={{ marginTop: spacing(4) }} />
      </ScrollView>
    </SafeAreaView>
  )
}
