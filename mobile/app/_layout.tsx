import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../src/store/auth'
import { colors } from '../src/theme'

function RootNavigator() {
  const { user, initializing } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (initializing) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, initializing, segments, router])

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary400} size="large" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="programme/[slug]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="exam/[examId]" />
      <Stack.Screen name="attempt/[attemptId]" />
      <Stack.Screen name="practice/[enrollmentId]/index" />
      <Stack.Screen name="practice/[enrollmentId]/day/[day]" />
      <Stack.Screen name="levels/[slug]" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
