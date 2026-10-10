import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, loadToken, setToken } from '../lib/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
    country?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    ;(async () => {
      const token = await loadToken()
      if (token) {
        try {
          const { data } = await api.get('/auth/me')
          setUser(data.user)
        } catch {
          await setToken(null)
        }
      }
      setInitializing(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    await setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
      country?: string
    }) => {
      const { data } = await api.post('/auth/register', payload)
      await setToken(data.token)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    await setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
