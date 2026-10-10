import { useCallback, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchAnalytics } from '../../src/lib/queries'
import type { AnalyticsOverview } from '../../src/types'
import { AccuracyRing, Card, EmptyState, Kpi, ScreenTitle } from '../../src/components/ui'
import { colors, font, radius, spacing } from '../../src/theme'

export default function Progress() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)

  const load = useCallback(async () => {
    setData(await fetchAnalytics().catch(() => null))
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <ScreenTitle>Progress</ScreenTitle>

        {!data || !data.has_activity ? (
          <EmptyState
            title="No performance data yet"
            description="Complete a daily practice session or a mock exam to unlock accuracy trends, subject-wise analytics and streaks."
          />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: spacing(3), marginBottom: spacing(3) }}>
              <Card style={{ flex: 1, alignItems: 'center' }}>
                <AccuracyRing value={data.overall_accuracy} size={84} />
                <Text style={{ color: colors.muted, fontSize: font.xs, marginTop: spacing(2) }}>Overall Accuracy</Text>
              </Card>
              <View style={{ flex: 1, gap: spacing(2) }}>
                <Kpi value={data.correct} label="Correct" tone="success" />
                <Kpi value={data.incorrect} label="Incorrect" tone="danger" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(4) }}>
              <Kpi value={data.current_streak} label="Streak" tone="streak" />
              <Kpi value={data.days_completed} label="Days Done" tone="success" />
              <Kpi value={data.mock_attempts} label="Mocks" />
            </View>

            {data.subject_accuracy.length > 0 && (
              <Card>
                <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800', marginBottom: spacing(3) }}>
                  Subject-wise Accuracy
                </Text>
                {data.subject_accuracy.map((s) => (
                  <View key={s.subject} style={{ marginBottom: spacing(3) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.text, fontSize: font.sm, fontWeight: '600' }}>{s.subject}</Text>
                      <Text style={{ color: colors.muted, fontSize: font.sm }}>{s.accuracy}% · {s.correct}/{s.total}</Text>
                    </View>
                    <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.bg2, overflow: 'hidden' }}>
                      <View
                        style={{
                          height: 8,
                          width: `${s.accuracy}%`,
                          backgroundColor: s.accuracy >= 70 ? colors.success : s.accuracy >= 50 ? colors.warning : colors.danger,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
