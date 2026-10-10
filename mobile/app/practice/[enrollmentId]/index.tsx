import { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchPracticePlan } from '../../../src/lib/queries'
import type { PracticePlan } from '../../../src/types'
import { Badge, Button, Card, Kpi } from '../../../src/components/ui'
import { colors, font, radius, spacing } from '../../../src/theme'

export default function PracticePlanScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>()
  const router = useRouter()
  const [plan, setPlan] = useState<PracticePlan | null>(null)

  const load = useCallback(async () => {
    setPlan(await fetchPracticePlan(Number(enrollmentId)).catch(() => null))
  }, [enrollmentId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!plan) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary400} /></View>
  }

  const openDay = (day: number) => router.push(`/practice/${plan.enrollment_id}/day/${day}`)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: 'Daily Practice', headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <View style={{ borderRadius: radius.xl, backgroundColor: colors.primary, padding: spacing(5), marginBottom: spacing(4) }}>
          <Text style={{ color: colors.white, fontSize: font.xl, fontWeight: '800' }}>{plan.title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            {plan.questions_per_day} questions every day · {plan.plan_days}-day plan
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(2) }}>
          <Kpi value={`${plan.completed_days}/${plan.plan_days}`} label="Days Done" tone="success" />
          <Kpi value={plan.streak} label="Current Streak" tone="streak" />
          <Kpi value={plan.best_streak} label="Best Streak" tone="streak" />
        </View>

        {plan.current_day <= plan.plan_days && (
          <Card style={{ marginBottom: spacing(4), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Day {plan.current_day}</Text>
              <Text style={{ color: colors.muted, fontSize: font.xs }}>{plan.questions_per_day} new questions.</Text>
            </View>
            <Button label="Continue →" onPress={() => openDay(plan.current_day)} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
          </Card>
        )}

        <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800', marginBottom: spacing(3) }}>Study Days</Text>
        {plan.schedule.map((d) => {
          const locked = d.status === 'locked'
          const done = d.status === 'completed'
          return (
            <Card key={d.day_number} style={{ marginBottom: spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
                <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: done ? 'rgba(34,197,94,0.2)' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: done ? colors.success : locked ? colors.faint : colors.primary400, fontWeight: '800' }}>{d.day_number}</Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Day {d.day_number}</Text>
                  {done ? <Badge label={`${d.accuracy}%`} tone="success" /> : locked ? <Badge label="Locked" tone="locked" /> : <Badge label="Available" />}
                </View>
              </View>
              {!locked && (
                <Button
                  label={done ? 'Review' : 'Start'}
                  variant={done ? 'secondary' : 'primary'}
                  style={{ paddingVertical: 8, paddingHorizontal: 14 }}
                  onPress={() => openDay(d.day_number)}
                />
              )}
            </Card>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
