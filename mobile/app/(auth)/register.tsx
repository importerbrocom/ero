import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../src/store/auth'
import { Button, Card, Input } from '../../src/components/ui'
import { EroLogo } from '../../src/components/EroLogo'
import { colors, font, spacing } from '../../src/theme'
import type { ApiError } from '../../src/lib/api'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true)
    setError(null)
    setErrors({})
    try {
      await register(form)
    } catch (e) {
      const apiErr = e as ApiError
      setError(apiErr.message)
      setErrors(apiErr.errors ?? {})
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
            Create your account
          </Text>
        </View>

        <Card>
          {error ? (
            <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: spacing(3) }}>
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}
          <Input label="Full name" value={form.name} onChangeText={set('name')} error={errors.name?.[0]} />
          <Input
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email?.[0]}
          />
          <Input label="Country" value={form.country} onChangeText={set('country')} placeholder="e.g. India" />
          <Input label="Password" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password?.[0]} />
          <Input
            label="Confirm password"
            value={form.password_confirmation}
            onChangeText={set('password_confirmation')}
            secureTextEntry
          />
          <Button label="Create Account" onPress={submit} loading={loading} fullWidth />
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing(4) }}>
            <Text style={{ color: colors.muted }}>Already have an account? </Text>
            <Link href="/(auth)/login" style={{ color: colors.primary400, fontWeight: '700' }}>
              Sign In
            </Link>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
