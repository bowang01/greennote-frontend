import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readToken, request, writeToken, type LoginResult } from '../api/client.ts'

type AuthContextValue = {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken())

  const login = useCallback(async (username: string, password: string) => {
    const data = await request<LoginResult>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false,
    )
    writeToken(data.accessToken)
    setToken(data.accessToken)
  }, [])

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
  }, [])

  const value = useMemo(() => ({ token, login, logout }), [token, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
