import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoginRequest } from '../types/auth.types'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      username: 'admin',
      password: 'admin123',
    },
  })

  const onSubmit = async (data: LoginRequest) => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      await login(data)
      navigate('/', { replace: true })
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales inválidas. Por favor intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: 56, height: 56 }}>
                    <span className="fs-3">🦷</span>
                  </div>
                  <h1 className="h4 fw-bold text-dark mb-1">Orthosmille Medic</h1>
                  <p className="text-muted small">Sistema Integral de Gestión Clínica</p>
                </div>

                {errorMsg && (
                  <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3 small" role="alert">
                    <div>{errorMsg}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
                  <div>
                    <label className="form-label small fw-semibold text-secondary">Usuario</label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      placeholder="Ej. admin o recepcion"
                      {...register('username', { required: 'El usuario es obligatorio' })}
                    />
                    {errors.username && <div className="invalid-feedback">{errors.username.message}</div>}
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-secondary">Contraseña</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      {...register('password', { required: 'La contraseña es obligatoria' })}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg w-100 mt-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Ingresando...
                      </>
                    ) : (
                      'Ingresar al Sistema'
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-top text-center">
                  <small className="text-muted d-block mb-1">Usuarios de prueba disponibles:</small>
                  <span className="badge bg-secondary-subtle text-secondary me-1">admin / admin123</span>
                  <span className="badge bg-secondary-subtle text-secondary">dr.perez / admin123</span>
                </div>
              </div>
            </div>
            <p className="text-center text-muted mt-3 small">
              Orthosmille Cloud &copy; 2026 - Servicios de Salud
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
