import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setUnauthorizedHandler } from '../api/axiosInstance'
import AuthContext from './AuthContextValue'

const TOKEN_KEY = 'redai:token'
const USER_KEY = 'redai:user'

function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

function normalizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    nome: user.nome,
    role: user.role,
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [usuario, setUsuario] = useState(getStoredUser)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUsuario(null)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async ({ email, senha }) => {
    const response = await api.post('/api/auth/login', { email, senha })
    const authToken = response.data.token
    const authUser = normalizeUser(response.data.user)

    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setToken(authToken)
    setUsuario(authUser)

    return authUser
  }, [])

  const value = useMemo(
    () => ({
      token,
      usuario,
      login,
      logout,
      isAuthenticated: Boolean(token && usuario),
    }),
    [login, logout, token, usuario],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
