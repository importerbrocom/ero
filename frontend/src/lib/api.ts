import axios, { AxiosError } from 'axios'

/**
 * Centralised API client.
 * - Base URL points at the versioned REST API (/api/v1).
 * - Attaches the bearer token from localStorage.
 * - Normalises error handling into a single ApiError shape.
 * - On 401 clears the session so the UI can redirect to login.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
})

const TOKEN_KEY = 'ero_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
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
    if (error.response?.status === 401) {
      setToken(null)
      // Avoid redirect loops on the auth pages themselves.
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/register')) {
        // Let the router pick this up via the auth store rehydrate.
      }
    }
    const normalised: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'Something went wrong.',
      errors: error.response?.data?.errors,
      status: error.response?.status,
    }
    return Promise.reject(normalised)
  },
)
