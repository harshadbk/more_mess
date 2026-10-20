import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, tokenStore } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()))

  // Restore the session from a saved token.
  useEffect(() => {
    if (!tokenStore.get()) return
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false))
  }, [])

  const startSession = useCallback(({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
    return user
  }, [])

  const login = useCallback(
    (identifier, password) => api('/auth/login', { method: 'POST', body: { identifier, password } }).then(startSession),
    [startSession],
  )
  const register = useCallback(
    (details) => api('/auth/register', { method: 'POST', body: details }).then(startSession),
    [startSession],
  )
  const logout = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Where each role lands after logging in. */
export const homeFor = (user) => (user?.role === 'admin' ? '/admin' : '/dashboard')

/** Renders children only for a logged-in user (optionally with a given role). */
export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return <p className="py-24 text-center text-muted">Loading your account…</p>
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />
  return children
}
