import axios from 'axios'
import { API_BASE_URL } from './apiConfig'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('orthosmille_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Error en la solicitud al servidor'
    return Promise.reject(new Error(message))
  }
)
