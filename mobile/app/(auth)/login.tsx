import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../src/store/auth'
import { Button, Card, Input } from '../../src/components/ui'
import { EroLogo } from '../../src/components/EroLogo'
import { colors, font, spacing } from '../../src/theme'
import type { ApiError } from '../../src/lib/api'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('student@ero.test')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (e) {
      setError((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing(5) }}>
        <View style={{ alignItems: 'center', marginBottom: spacing(8) }}>
          <EroLogo size="lg" />
          <Text style={{ color: colors.text, fontSize: font.xl, fontWeight: '800', marginTop: spacing(5) }}>
            Welcome back
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, textAlign: 'center' }}>
            Global Exams. Greater Opportunities.
          </Text>
        </View>

        <Card>
          {error ? (
            <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: spacing(3) }}>
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button label="Sign In with Email" onPress={submit} loading={loading} fullWidth />
          <Link
            href="/(auth)/forgot-password"
            style={{ color: colors.muted, fontSize: font.sm, textAlign: 'right', marginTop: spacing(3) }}
          >
            Forgot password?
          </Link>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing(4) }}>
            <Text style={{ color: colors.muted }}>Don't have an account? </Text>
            <Link href="/(auth)/register" style={{ color: colors.primary400, fontWeight: '700' }}>
              Create Account
            </Link>
          </View>
        </Card>

        <Text style={{ color: colors.faint, fontSize: font.xs, textAlign: 'center', marginTop: spacing(6) }}>
          Demo: student@ero.test · password: password
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
