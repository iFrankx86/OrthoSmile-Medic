import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { User, UserRole } from '../types/models'
import { api } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// In-memory session preservation for iframe resilience
let inMemoryUser: User | null = null
let inMemoryToken: string | null = null

function readStoredSession(): { user: User | null; token: string | null } {
  if (inMemoryUser) {
    console.log('[AuthContext Storage] Restored session from in-memory cache:', inMemoryUser.username)
    return { user: inMemoryUser, token: inMemoryToken }
  }

  // Check localStorage
  try {
    const raw = localStorage.getItem('orthosmile_user') || localStorage.getItem('ortho_user')
    const tok = localStorage.getItem('orthosmile_token') || localStorage.getItem('ortho_token')
    if (raw) {
      const parsed = JSON.parse(raw)
      inMemoryUser = parsed
      inMemoryToken = tok
      console.log('[AuthContext Storage] Restored session from localStorage:', parsed.username)
      return { user: parsed, token: tok }
    }
  } catch (e: any) {
    console.warn('[AuthContext Storage Warning] Failed to access localStorage (possibly restricted in iframe sandbox):', e?.message || e)
  }

  // Check sessionStorage
  try {
    const raw = sessionStorage.getItem('orthosmile_user') || sessionStorage.getItem('ortho_user')
    const tok = sessionStorage.getItem('orthosmile_token') || sessionStorage.getItem('ortho_token')
    if (raw) {
      const parsed = JSON.parse(raw)
      inMemoryUser = parsed
      inMemoryToken = tok
      console.log('[AuthContext Storage] Restored session from sessionStorage:', parsed.username)
      return { user: parsed, token: tok }
    }
  } catch (e: any) {
    console.warn('[AuthContext Storage Warning] Failed to access sessionStorage:', e?.message || e)
  }

  return { user: null, token: null }
}

function writeStoredSession(u: User | null, tok: string | null) {
  inMemoryUser = u
  inMemoryToken = tok

  if (!u) {
    console.log('[AuthContext Storage] Purging stored session across all layers...')
    try {
      localStorage.removeItem('orthosmile_user')
      localStorage.removeItem('orthosmile_token')
      localStorage.removeItem('ortho_user')
      localStorage.removeItem('ortho_token')
    } catch (e: any) {
      console.warn('[AuthContext Storage Warning] localStorage removal error:', e?.message)
    }
    try {
      sessionStorage.removeItem('orthosmile_user')
      sessionStorage.removeItem('orthosmile_token')
      sessionStorage.removeItem('ortho_user')
      sessionStorage.removeItem('ortho_token')
    } catch (e: any) {
      console.warn('[AuthContext Storage Warning] sessionStorage removal error:', e?.message)
    }
    return
  }

  const str = JSON.stringify(u)
  const tokenStr = tok || `osm_token_${Date.now()}`

  try {
    localStorage.setItem('orthosmile_user', str)
    localStorage.setItem('orthosmile_token', tokenStr)
    localStorage.setItem('ortho_user', str)
    localStorage.setItem('ortho_token', tokenStr)
    console.log('[AuthContext Storage] Stored session written to localStorage')
  } catch (e: any) {
    console.warn('[AuthContext Storage Warning] Failed writing to localStorage:', e?.message)
  }

  try {
    sessionStorage.setItem('orthosmile_user', str)
    sessionStorage.setItem('orthosmile_token', tokenStr)
    sessionStorage.setItem('ortho_user', str)
    sessionStorage.setItem('ortho_token', tokenStr)
    console.log('[AuthContext Storage] Stored session written to sessionStorage')
  } catch (e: any) {
    console.warn('[AuthContext Storage Warning] Failed writing to sessionStorage:', e?.message)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => readStoredSession().user)
  const [token, setToken] = useState<string | null>(() => readStoredSession().token)
  const [loading, setLoading] = useState(false)

  // 1. Monitor AuthProvider mount, session hydration, and Firebase Auth state
  useEffect(() => {
    console.group('[AuthProvider: Mount & Initialization]')
    console.log('Timestamp:', new Date().toISOString())

    // Hydrate existing session
    try {
      const session = readStoredSession()
      if (session.user) {
        console.log('✓ Successfully hydrated active session:', {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role,
          email: session.user.email,
          hasToken: !!session.token,
        })
        setUser(session.user)
        setToken(session.token)
      } else {
        console.log('○ No active session discovered. App is in unauthenticated state.')
      }
    } catch (hydrateErr: any) {
      console.error('[AuthProvider Hydration Error] Caught error while reading session:', {
        message: hydrateErr?.message,
        stack: hydrateErr?.stack,
        details: hydrateErr,
      })
    }

    // Subscribe to Firebase Auth onAuthStateChanged
    console.log('[Firebase Auth] Subscribing to onAuthStateChanged listener...')
    let unsubscribe = () => {}
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          console.log('[Firebase Auth: onAuthStateChanged]', {
            event: firebaseUser ? 'FIREBASE_USER_ACTIVE' : 'NO_FIREBASE_USER',
            uid: firebaseUser?.uid ?? null,
            email: firebaseUser?.email ?? null,
            displayName: firebaseUser?.displayName ?? null,
            isAnonymous: firebaseUser?.isAnonymous ?? null,
            timestamp: new Date().toISOString(),
          })
        },
        (error) => {
          console.error('[Firebase Auth: onAuthStateChanged Error] Silent listener error captured:', {
            code: (error as any)?.code,
            message: error?.message,
            stack: error?.stack,
          })
        }
      )
    } catch (listenerSetupErr: any) {
      console.warn('[Firebase Auth] Could not initialize onAuthStateChanged listener:', listenerSetupErr?.message)
    }

    console.groupEnd()

    return () => {
      console.log('[Firebase Auth] Cleaning up onAuthStateChanged subscription')
      unsubscribe()
    }
  }, [])

  // 2. Track authentication state transitions
  useEffect(() => {
    console.groupCollapsed(`[AuthProvider State Transition] -> ${user ? `AUTHENTICATED (${user.username})` : 'UNAUTHENTICATED'}`)
    console.log('Timestamp:', new Date().toISOString())
    console.log('isAuthenticated:', !!user)
    console.log('User Payload:', user)
    console.log('Token Present:', !!token)
    console.groupEnd()
  }, [user, token])

  // 3. Firebase Auth & Clinic signIn function with detailed diagnostics
  const signIn = async (username: string, password: string): Promise<void> => {
    console.group('[Firebase Auth] signIn initiated')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Target username / identifier:', username)
    console.log('Password length provided:', password ? password.length : 0)

    const rawUser = (username || '').trim()
    const cleanPass = (password || '').trim()

    if (!rawUser || !cleanPass) {
      const emptyErr = new Error('Por favor ingrese su usuario y contraseña.')
      console.error('[Firebase Auth: Validation Error] Missing credentials:', {
        hasUsername: !!rawUser,
        hasPassword: !!cleanPass,
      })
      console.groupEnd()
      throw emptyErr
    }

    // Step 1: Firebase Firestore & Fast-Path
    try {
      console.log('[Firebase Auth: Step 1] Invoking api.login (Firebase Firestore & clinic accounts)...')
      const fbUser = await api.login(rawUser, cleanPass)

      console.log('[Firebase Auth: Step 1 Success] Authenticated successfully with Firebase/Clinic:', {
        id: fbUser.id,
        username: fbUser.username,
        role: fbUser.role,
        fullName: fbUser.fullName,
        email: fbUser.email,
        tokenReceived: !!fbUser.token,
      })

      const mappedUser: User = {
        id: fbUser.id,
        username: fbUser.username,
        role: fbUser.role as UserRole,
        email: fbUser.email || `${fbUser.username}@orthosmile.com`,
      }
      const tokenStr = fbUser.token || `fb_token_${fbUser.id}_${Date.now()}`

      console.log('[Firebase Auth: Step 1] Writing session to multi-tier storage...')
      writeStoredSession(mappedUser, tokenStr)

      console.log('[Firebase Auth: Step 1] Updating React state (user, token)...')
      setUser(mappedUser)
      setToken(tokenStr)

      console.log('[Firebase Auth: Step 1 Complete] User is now authenticated.')
      console.groupEnd()
      return
    } catch (apiErr: any) {
      console.warn('[Firebase Auth: Step 1 Failed] api.login could not verify user. Inspecting error:', {
        message: apiErr?.message,
        code: apiErr?.code,
        stack: apiErr?.stack,
        details: apiErr,
      })
      console.log('[Firebase Auth: Fallback] Proceeding to Step 2 (/api/v1/auth/login endpoint)...')
    }

    // Step 2: Fallback to /api/v1/auth/login Express route
    try {
      console.log('[Firebase Auth: Step 2] Sending POST to /api/v1/auth/login...')
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawUser, password: cleanPass }),
      })

      console.log('[Firebase Auth: Step 2 Response] HTTP Status:', res.status, res.statusText)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const serverMsg = errData.message || `Error del servidor HTTP ${res.status}: Credenciales inválidas.`
        console.error('[Firebase Auth: Step 2 Error] Server rejected login:', {
          status: res.status,
          statusText: res.statusText,
          responseBody: errData,
        })
        console.groupEnd()
        throw new Error(serverMsg)
      }

      const data = await res.json()
      console.log('[Firebase Auth: Step 2 Success] Server fallback authenticated user:', {
        id: data.id || data.userId,
        username: data.username,
        role: data.role,
        hasToken: !!data.token,
      })

      const loggedUser: User = {
        id: data.id || data.userId,
        username: data.username,
        role: data.role,
        email: data.email || `${data.username}@orthosmile.com`,
      }

      writeStoredSession(loggedUser, data.token)
      setUser(loggedUser)
      setToken(data.token)

      console.log('[Firebase Auth: Step 2 Complete] State updated with server-authenticated user.')
      console.groupEnd()
      return
    } catch (expressErr: any) {
      console.error('[Firebase Auth: Fatal Error] All authentication pathways failed:', {
        message: expressErr?.message,
        stack: expressErr?.stack,
        error: expressErr,
      })
      console.groupEnd()
      throw expressErr
    }
  }

  // Alias login to signIn for backward compatibility
  const login = signIn

  const logout = () => {
    console.group('[AuthProvider: logout]')
    console.log('Initiating logout at:', new Date().toISOString())
    console.log('User logging out:', user?.username ?? 'Anonymous')
    writeStoredSession(null, null)
    setUser(null)
    setToken(null)
    console.log('✓ Session cleared and state reset to null.')
    console.groupEnd()
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
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, signIn, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
