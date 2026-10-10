import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors } from '../../src/theme'

/**
 * Bottom tab bar (screenshots 1, 2, 4, 13): Home · Exams · Tests · Progress · Profile.
 * Icons use emoji to avoid an extra icon-font dependency; swap for an icon set
 * (e.g. @expo/vector-icons) if desired.
 */
const ICONS: Record<string, string> = {
  index: '🏠',
  exams: '📚',
  tests: '📝',
  progress: '📊',
  profile: '👤',
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary400,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 20, color }}>{ICONS[route.name] ?? '•'}</Text>
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="exams" options={{ title: 'Exams' }} />
      <Tabs.Screen name="tests" options={{ title: 'Tests' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
