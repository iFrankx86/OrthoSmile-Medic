import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserRole } from '../../types'
import { api } from '../../services/api'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (...roles: UserRole[]) => boolean
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

const defaultAuthContext: AuthContextType = {
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  hasRole: () => false,
}

const defaultToastContext: ToastContextType = {
  toasts: [],
  showToast: () => {},
  removeToast: () => {},
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext)
const ToastContext = createContext<ToastContextType>(defaultToastContext)

export function useAuth() {
  const context = useContext(AuthContext)
  return context || defaultAuthContext
}

export function useToast() {
  const context = useContext(ToastContext)
  return context || defaultToastContext
}

export const AuthProvider = AppProviders
export const ToastProvider = AppProviders

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('ortho_user')
      if (savedUser) return JSON.parse(savedUser)
    } catch {
      // ignore
    }
    return null
  })

  // Toasts state
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const login = async (username: string, password: string) => {
    try {
      const loggedUser = await api.login(username, password)
      setUser(loggedUser)
      if (loggedUser.token) {
        localStorage.setItem('ortho_token', loggedUser.token)
      }
      localStorage.setItem('ortho_user', JSON.stringify(loggedUser))
      showToast(`¡Bienvenido de vuelta, ${loggedUser.username}!`, 'success')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión'
      showToast(msg, 'error')
      throw err
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
    localStorage.removeItem('ortho_token')
    localStorage.removeItem('ortho_user')
    showToast('Sesión cerrada correctamente', 'info')
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
        {children}

        {/* Global Toast notifications overlay */}
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '380px',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((toast) => {
            const bg =
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'warning'
                ? '#f59e0b'
                : '#0284c7'
            return (
              <div
                key={toast.id}
                style={{
                  background: bg,
                  color: 'white',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  pointerEvents: 'auto',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <span>{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: 0.8,
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}
