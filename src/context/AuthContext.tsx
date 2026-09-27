import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserRole } from '../types/models'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('orthosmile_user')
    const savedToken = localStorage.getItem('orthosmile_token')
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } catch (e) {
        localStorage.removeItem('orthosmile_user')
        localStorage.removeItem('orthosmile_token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Usuario o contraseña incorrectos.')
    }

    const data = await res.json()
    const loggedUser: User = {
      id: data.id || data.userId,
      username: data.username,
      role: data.role,
      email: data.email || `${data.username}@orthosmile.com`,
    }

    setUser(loggedUser)
    setToken(data.token)
    localStorage.setItem('orthosmile_user', JSON.stringify(loggedUser))
    localStorage.setItem('orthosmile_token', data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('orthosmile_user')
    localStorage.removeItem('orthosmile_token')
  }

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
