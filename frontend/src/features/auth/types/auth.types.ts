export type UserRole = 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'ODONTOLOGO' | 'CAJA'

export interface User {
  id: number
  username: string
  role: UserRole
  email?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  id: number
  username: string
  role: UserRole
  token: string
}
