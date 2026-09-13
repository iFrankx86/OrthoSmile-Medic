import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

type LoginForm = {
	username: string
	password: string
}

export function LoginPage() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>()

	const onSubmit = (data: LoginForm) => {
		console.log('Login pending security phase', data)
	}

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-12 col-md-6 col-lg-4">
					<div className="card page-card">
						<div className="card-body p-4">
							<h1 className="h4 mb-3">Iniciar sesión</h1>
							<form onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
								<div>
									<label className="form-label">Usuario</label>
									<input className="form-control" {...register('username', { required: 'Campo obligatorio' })} />
									{errors.username && <small className="text-danger">{errors.username.message}</small>}
								</div>

								<div>
									<label className="form-label">Contraseña</label>
									<input
										type="password"
										className="form-control"
										{...register('password', { required: 'Campo obligatorio' })}
									/>
									{errors.password && <small className="text-danger">{errors.password.message}</small>}
								</div>

								<button type="submit" className="btn btn-primary w-100">
									Ingresar
								</button>
							</form>
						</div>
					</div>
					<p className="text-center text-muted mt-3 mb-0">
						Ir al <Link to="/">dashboard</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

