import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/store/auth'
import { Button, Card, ScreenTitle } from '../../src/components/ui'
import { colors, font, spacing } from '../../src/theme'

export default function Profile() {
  const { user, logout } = useAuth()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <ScreenTitle>Profile</ScreenTitle>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(4), marginBottom: spacing(4) }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.white, fontSize: font.xl, fontWeight: '800' }}>{user?.name?.[0] ?? 'U'}</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '800' }}>{user?.name}</Text>
              <Text style={{ color: colors.muted }}>{user?.email}</Text>
              {user?.country ? <Text style={{ color: colors.faint, fontSize: font.xs }}>{user.country}</Text> : null}
            </View>
          </View>
          <Button label="Sign Out" variant="danger" onPress={logout} fullWidth />
        </Card>

        <Text style={{ color: colors.faint, fontSize: font.xs, textAlign: 'center', marginTop: spacing(8) }}>
          ERO — Medical Learning Without Borders
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
