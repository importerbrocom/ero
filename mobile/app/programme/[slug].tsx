import { useEffect, useState } from 'react'
import { ScrollView, Text, View, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchProgramme } from '../../src/lib/queries'
import type { ProgrammeDetail } from '../../src/types'
import { Badge, Button, Card } from '../../src/components/ui'
import { colors, font, radius, spacing } from '../../src/theme'

export default function ProgrammeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [programme, setProgramme] = useState<ProgrammeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetchProgramme(slug).then(setProgramme).catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4) }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </SafeAreaView>
    )
  }

  if (!programme) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary400} />
      </View>
    )
  }

  const startExam = (examId: number, type: string) => {
    if (type === 'daily_practice') router.push(`/exam/${examId}?mode=practice`)
    else router.push(`/exam/${examId}`)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: programme.name, headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <View style={{ borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing(5), marginBottom: spacing(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
            <Text style={{ fontSize: 40 }}>{programme.flag_emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: font.xxl, fontWeight: '800' }}>{programme.name}</Text>
              <Text style={{ color: colors.muted }}>{programme.full_name}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing(3) }}>
            {programme.has_access
              ? <Badge label="Unlocked" tone="success" />
              : <Badge label="Redeem a code to unlock" tone="locked" />}
          </View>
        </View>

        {programme.has_access && programme.exams.some((e) => e.type === 'level_mock') ? (
          <Card style={{ marginBottom: spacing(4), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Level Mocks</Text>
              <Text style={{ color: colors.muted, fontSize: font.xs }}>Pass each to unlock the next.</Text>
            </View>
            <Button label="View Levels" style={{ paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => router.push(`/levels/${programme.slug}`)} />
          </Card>
        ) : null}

        <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800', marginBottom: spacing(3) }}>Examinations</Text>
        {programme.exams.filter((e) => e.type !== 'level_mock').length === 0 ? (
          <Card><Text style={{ color: colors.muted }}>No published examinations yet.</Text></Card>
        ) : (
          programme.exams.filter((e) => e.type !== 'level_mock').map((exam) => (
            <Card key={exam.id} style={{ marginBottom: spacing(3) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginBottom: 4 }}>
                <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{exam.title}</Text>
                <Badge label={exam.type.replace('_', ' ')} />
              </View>
              {exam.description ? <Text style={{ color: colors.muted, fontSize: font.sm }}>{exam.description}</Text> : null}
              <Text style={{ color: colors.faint, fontSize: font.xs, marginTop: spacing(2) }}>
                {exam.type === 'daily_practice'
                  ? `${exam.plan_days} days · ${exam.questions_per_day} questions/day`
                  : `${exam.block_count} blocks · ${exam.total_questions} questions · ${exam.block_duration_minutes} min/block`}
              </Text>
              <Button
                label={programme.has_access ? 'Start' : 'Locked'}
                variant={programme.has_access ? 'primary' : 'secondary'}
                disabled={!programme.has_access}
                style={{ marginTop: spacing(3) }}
                fullWidth
                onPress={() => startExam(exam.id, exam.type)}
              />
            </Card>
          ))
        )}

        <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800', marginVertical: spacing(3) }}>Subjects</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
          {programme.subjects.map((s) => (
            <Card key={s.id} style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
              <View style={{ width: 32, height: 32, borderRadius: radius.md, backgroundColor: s.color ?? colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.white, fontWeight: '800' }}>{s.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: font.sm, fontWeight: '600' }} numberOfLines={1}>{s.name}</Text>
                <Text style={{ color: colors.muted, fontSize: font.xs }}>{s.question_count}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
