import { create } from 'zustand'
import { api, getToken, setToken } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
    country?: string
  }) => Promise<void>
  logout: () => Promise<void>
  rehydrate: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.token)
    set({ user: data.user })
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setToken(data.token)
    set({ user: data.user })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout
    }
    setToken(null)
    set({ user: null })
  },

  rehydrate: async () => {
    const token = getToken()
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, initialized: true })
    } catch {
      setToken(null)
      set({ user: null, initialized: true })
    }
  },
}))
