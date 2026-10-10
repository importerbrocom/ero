import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/store/auth'
import { fetchAnalytics, fetchProgrammes } from '../../src/lib/queries'
import type { AnalyticsOverview, Programme } from '../../src/types'
import { Button, Card, Kpi } from '../../src/components/ui'
import { EroLogo } from '../../src/components/EroLogo'
import { colors, font, radius, spacing } from '../../src/theme'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [ps, a] = await Promise.all([
      fetchProgrammes().catch(() => []),
      fetchAnalytics().catch(() => null),
    ])
    setProgrammes(ps)
    setAnalytics(a)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const accessible = programmes.filter((p) => p.has_access)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary400} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4) }}>
          <EroLogo size="sm" tagline={false} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.white, fontWeight: '800' }}>{user?.name?.[0] ?? 'U'}</Text>
          </View>
        </View>

        {/* Welcome hero */}
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primary, padding: spacing(5), marginBottom: spacing(4) }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: font.sm }}>Welcome back</Text>
          <Text style={{ color: colors.white, fontSize: font.xl, fontWeight: '800', marginTop: 4 }}>
            {user?.name}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            Prepare for global exams. Build your future.
          </Text>
          <Button
            label="Choose an Exam →"
            variant="secondary"
            style={{ marginTop: spacing(4), alignSelf: 'flex-start', backgroundColor: colors.white }}
            onPress={() => router.push('/(tabs)/exams')}
          />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(2) }}>
          <Kpi value={`${analytics?.overall_accuracy ?? 0}%`} label="Accuracy" />
          <Kpi value={analytics?.questions_attempted ?? 0} label="Answered" />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing(2), marginBottom: spacing(5) }}>
          <Kpi value={analytics?.days_completed ?? 0} label="Days Done" tone="success" />
          <Kpi value={analytics?.current_streak ?? 0} label="Streak" tone="streak" />
        </View>

        {/* Programmes */}
        <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800', marginBottom: spacing(3) }}>
          My Programmes
        </Text>
        {accessible.length === 0 ? (
          <Card>
            <Text style={{ color: colors.muted }}>
              No programmes unlocked yet. Browse exams and redeem an activation code to begin.
            </Text>
            <Button label="Browse Exams" style={{ marginTop: spacing(3) }} onPress={() => router.push('/(tabs)/exams')} />
          </Card>
        ) : (
          accessible.map((p) => (
            <Card key={p.id} style={{ marginBottom: spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
                <Text style={{ fontSize: 26 }}>{p.flag_emoji ?? '🎓'}</Text>
                <View>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{p.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: font.xs }}>
                    {p.question_count.toLocaleString()} questions
                  </Text>
                </View>
              </View>
              <Button label="Open" variant="secondary" style={{ paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => router.push(`/programme/${p.slug}`)} />
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
