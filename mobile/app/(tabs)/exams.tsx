import { useCallback, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchProgrammes, redeemCode } from '../../src/lib/queries'
import type { Programme } from '../../src/types'
import { Badge, Button, Card, Input, ScreenTitle } from '../../src/components/ui'
import { colors, font, spacing } from '../../src/theme'
import type { ApiError } from '../../src/lib/api'

export default function Exams() {
  const router = useRouter()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setProgrammes(await fetchProgrammes().catch(() => []))
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const doRedeem = async () => {
    if (!code.trim()) return
    setRedeeming(true)
    setMsg(null)
    try {
      const res = await redeemCode(code.trim())
      setMsg({ text: res.message, ok: true })
      setCode('')
      await load()
    } catch (e) {
      setMsg({ text: (e as ApiError).message, ok: false })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(8) }}>
        <ScreenTitle>Choose Your Exam</ScreenTitle>

        <Card style={{ marginBottom: spacing(4) }}>
          <Input
            label="Have an activation code?"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="ERO-XXXX-XXXX"
          />
          <Button label="Redeem" variant="secondary" onPress={doRedeem} loading={redeeming} />
          {msg ? (
            <Text style={{ color: msg.ok ? colors.success : colors.danger, marginTop: spacing(2) }}>{msg.text}</Text>
          ) : null}
        </Card>

        {programmes.map((p) => (
          <Card key={p.id} style={{ marginBottom: spacing(3) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), flex: 1 }}>
                <Text style={{ fontSize: 30 }}>{p.flag_emoji ?? '🎓'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
                    <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800' }}>{p.name}</Text>
                    {p.has_access ? <Badge label="Unlocked" tone="success" /> : <Badge label="Locked" tone="locked" />}
                  </View>
                  <Text style={{ color: colors.muted, fontSize: font.sm }}>{p.full_name}</Text>
                  <Text style={{ color: colors.faint, fontSize: font.xs, marginTop: 2 }}>
                    {p.question_count.toLocaleString()} questions · {p.country}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              label={p.has_access ? 'Open Programme' : 'View Details'}
              variant={p.has_access ? 'primary' : 'secondary'}
              style={{ marginTop: spacing(3) }}
              fullWidth
              onPress={() => router.push(`/programme/${p.slug}`)}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
