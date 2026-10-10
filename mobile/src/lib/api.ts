import axios, { AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

/**
 * Centralised API client for the ERO mobile app.
 * - Base URL comes from app.json `extra.apiBaseUrl` (points at the deployed API).
 * - Bearer token is persisted in AsyncStorage and attached to every request.
 * - Errors are normalised into a single ApiError shape.
 */
const baseURL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://ero.nokkoo.in/api/v1'

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 20000,
})

const TOKEN_KEY = 'ero_token'

// In-memory mirror so the request interceptor stays synchronous after load.
let cachedToken: string | null = null

export async function loadToken(): Promise<string | null> {
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY)
  return cachedToken
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
  else await AsyncStorage.removeItem(TOKEN_KEY)
}

export function getCachedToken(): string | null {
  return cachedToken
}

api.interceptors.request.use((config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`
  }
  return config
})

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiError>) => {
    const normalised: ApiError = {
      message:
        error.response?.data?.message ??
        (error.code === 'ECONNABORTED'
          ? 'The request timed out. Check your connection.'
          : error.message) ??
        'Something went wrong.',
      errors: error.response?.data?.errors,
      status: error.response?.status,
    }
    return Promise.reject(normalised)
  },
)
