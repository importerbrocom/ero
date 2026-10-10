import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native'
import { colors, font, radius, spacing } from '../theme'

/* ERO mobile design-system primitives — mirror the web components. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
  style,
}: {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}) {
  const bg: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
    danger: colors.danger,
    success: colors.success,
  }
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg[variant], opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={colors.white} size="small" style={{ marginRight: 8 }} />}
      <Text
        style={[
          styles.buttonText,
          { color: variant === 'ghost' ? colors.muted : colors.white },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Input({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
        {...props}
      />
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  )
}

export function Badge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'locked'
}) {
  const map = {
    default: { bg: 'rgba(37,99,235,0.15)', fg: colors.primary400 },
    success: { bg: 'rgba(34,197,94,0.15)', fg: colors.success },
    danger: { bg: 'rgba(239,68,68,0.15)', fg: colors.danger },
    warning: { bg: 'rgba(245,158,11,0.15)', fg: colors.warning },
    locked: { bg: 'rgba(255,255,255,0.05)', fg: colors.faint },
  }[tone]
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={{ color: map.fg, fontSize: font.xs, fontWeight: '700' }}>{label}</Text>
    </View>
  )
}

export function Kpi({
  value,
  label,
  tone = 'default',
}: {
  value: React.ReactNode
  label: string
  tone?: 'default' | 'success' | 'danger' | 'streak'
}) {
  const color = {
    default: colors.primary400,
    success: colors.success,
    danger: colors.danger,
    streak: colors.streak,
  }[tone]
  return (
    <Card style={styles.kpi}>
      <Text style={{ color, fontSize: font.xl, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: font.xs, marginTop: 2 }}>{label}</Text>
    </Card>
  )
}

/** Lightweight donut-style accuracy indicator without external SVG deps. */
export function AccuracyRing({ value, size = 72 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: 'transparent',
          borderTopColor: clamped >= 70 ? colors.success : clamped >= 40 ? colors.warning : colors.primary400,
          transform: [{ rotate: `${(clamped / 100) * 360}deg` }],
        }}
      />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: font.base }}>
        {Math.round(clamped)}%
      </Text>
    </View>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <View style={styles.empty}>
      <Text style={{ color: colors.text, fontSize: font.lg, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6 }}>{description}</Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing(4) }}>{action}</View> : null}
    </View>
  )
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.screenTitle}>{children}</Text>
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: { fontSize: font.base, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
  },
  inputLabel: { color: colors.muted, fontSize: font.sm, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: font.base,
  },
  inputError: { color: colors.danger, fontSize: font.xs, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  kpi: { flex: 1, alignItems: 'flex-start', padding: spacing(3) },
  empty: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: spacing(8),
    alignItems: 'center',
  },
  screenTitle: { color: colors.text, fontSize: font.xxl, fontWeight: '800', marginBottom: spacing(4) },
})
