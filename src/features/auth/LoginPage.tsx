import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smile, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
  const { login, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username.trim(), password.trim())
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verifique sus credenciales.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Smile size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            OrthoSmile Medic
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Gestión Odontológica y de Ortodoncia
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all min-h-[48px]"
                placeholder="Ej. dr.chavez, admin, mabel"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all min-h-[48px]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all min-h-[48px] disabled:opacity-60 flex items-center justify-center cursor-pointer"
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Servidor protegido con encriptación y control de acceso RBAC</span>
        </div>
      </div>
    </div>
  )
}
