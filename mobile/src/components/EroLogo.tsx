import React from 'react'
import { Text, View } from 'react-native'
import { colors, font } from '../theme'

/**
 * ERO wordmark (replaceable placeholder — the official logo asset will be
 * supplied separately). Matches the web EroLogo: blue cap + "ERO" + tagline.
 */
export function EroLogo({ size = 'md', tagline = true }: { size?: 'sm' | 'md' | 'lg'; tagline?: boolean }) {
  const titleSize = { sm: font.lg, md: font.xl, lg: font.xxl }[size]
  const capSize = { sm: 26, md: 34, lg: 48 }[size]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: capSize,
          height: capSize,
          borderRadius: capSize / 4,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ color: colors.white, fontSize: capSize * 0.5, fontWeight: '900' }}>🎓</Text>
      </View>
      <View>
        <Text style={{ fontSize: titleSize, fontWeight: '900', letterSpacing: 1 }}>
          <Text style={{ color: colors.white }}>E</Text>
          <Text style={{ color: colors.primary400 }}>R</Text>
          <Text style={{ color: colors.white }}>O</Text>
        </Text>
        {tagline ? (
          <Text style={{ color: colors.muted, fontSize: font.xs, letterSpacing: 2, textTransform: 'uppercase' }}>
            Medical Learning Without Borders
          </Text>
        ) : null}
      </View>
    </View>
  )
}
