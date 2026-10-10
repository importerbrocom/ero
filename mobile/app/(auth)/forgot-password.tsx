import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { api, type ApiError } from '../../src/lib/api'
import { Button, Card, Input } from '../../src/components/ui'
import { EroLogo } from '../../src/components/EroLogo'
import { colors, font, spacing } from '../../src/theme'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() })
      setMessage(data.message)
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
        <View style={{ alignItems: 'center', marginBottom: spacing(6) }}>
          <EroLogo size="lg" />
          <Text style={{ color: colors.text, fontSize: font.xl, fontWeight: '800', marginTop: spacing(5) }}>
            Reset your password
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, textAlign: 'center' }}>
            Enter your email and we'll send a reset link.
          </Text>
        </View>

        <Card>
          {message ? (
            <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: colors.success }}>{message}</Text>
            </View>
          ) : (
            <>
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
              <Button label="Send reset link" onPress={submit} loading={loading} fullWidth />
            </>
          )}
          <View style={{ alignItems: 'center', marginTop: spacing(4) }}>
            <Link href="/(auth)/login" style={{ color: colors.primary400, fontWeight: '700' }}>
              Back to sign in
            </Link>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
