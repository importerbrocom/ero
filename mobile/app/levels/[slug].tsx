import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchLevelLadder } from '../../src/lib/queries'
import type { LevelLadder } from '../../src/types'
import { Badge, Button, Card } from '../../src/components/ui'
import { colors, font, radius, spacing } from '../../src/theme'

export default function LevelsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [ladder, setLadder] = useState<LevelLadder | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetchLevelLadder(slug).then(setLadder).catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4) }}><Text style={{ color: colors.danger }}>{error}</Text></SafeAreaView>
  }
  if (!ladder) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary400} /></View>
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: 'Level Mocks', headerStyle: { backgroundColor: colors.bg2 }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <Text style={{ color: colors.muted, marginBottom: spacing(4) }}>
          {ladder.levels} levels · pass each mock (≥ {ladder.pass_accuracy}%) to unlock the next.
        </Text>
        {ladder.ladder.map((lvl) => {
          const locked = lvl.status === 'locked'
          const soon = lvl.status === 'coming_soon'
          const done = lvl.status === 'completed'
          return (
            <Card key={lvl.level} style={{ marginBottom: spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), flex: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: done ? 'rgba(34,197,94,0.2)' : locked || soon ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: done ? colors.success : locked || soon ? colors.faint : colors.primary400, fontWeight: '800', fontSize: font.lg }}>{lvl.level}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{lvl.title}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: 2 }}>
                    {lvl.passed ? <Badge label="Passed" tone="success" /> : null}
                    {lvl.best_accuracy != null ? <Text style={{ color: colors.muted, fontSize: font.xs }}>Best: {lvl.best_accuracy}%</Text> : null}
                  </View>
                </View>
              </View>
              {soon ? (
                <Badge label="Soon" tone="locked" />
              ) : locked ? (
                <Badge label="Locked" tone="locked" />
              ) : (
                <Button
                  label={done ? 'Retake' : 'Start'}
                  variant={done ? 'secondary' : 'primary'}
                  style={{ paddingVertical: 8, paddingHorizontal: 14 }}
                  onPress={() => router.push(`/exam/${lvl.exam_id}`)}
                />
              )}
            </Card>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
