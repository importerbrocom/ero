import { useCallback, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchAttemptHistory } from '../../src/lib/queries'
import type { AttemptHistoryItem } from '../../src/types'
import { Badge, Button, Card, EmptyState, ScreenTitle } from '../../src/components/ui'
import { colors, font, spacing } from '../../src/theme'

export default function Tests() {
  const router = useRouter()
  const [items, setItems] = useState<AttemptHistoryItem[] | null>(null)

  const load = useCallback(async () => {
    setItems(await fetchAttemptHistory().catch(() => []))
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <ScreenTitle>My Tests</ScreenTitle>

        {items && items.length === 0 ? (
          <EmptyState
            title="No attempts yet"
            description="Start a mock exam from a programme and it will appear here with your score."
            action={<Button label="Browse Exams" onPress={() => router.push('/(tabs)/exams')} />}
          />
        ) : (
          (items ?? []).map((a) => (
            <Card key={a.id} style={{ marginBottom: spacing(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), flex: 1 }}>
                <Text style={{ fontSize: 24 }}>{a.flag_emoji ?? '🎓'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{a.exam_title}</Text>
                  <Text style={{ color: colors.muted, fontSize: font.xs }}>
                    {a.programme} · {a.exam_type.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              {a.status === 'completed' ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: font.lg }}>{a.accuracy}%</Text>
                  <Text style={{ color: colors.muted, fontSize: font.xs }}>{a.correct_count}/{a.total_questions}</Text>
                </View>
              ) : a.status === 'in_progress' ? (
                <Button label="Resume" style={{ paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => router.push(`/attempt/${a.id}`)} />
              ) : (
                <Badge label={a.status} tone="danger" />
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
