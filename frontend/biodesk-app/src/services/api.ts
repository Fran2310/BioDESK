import axios from 'axios';
import type { RegisterData, LoginData } from './interfaces/auth';
export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API_PROD, // Cambia según el backend en uso
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor para devolver solo el error del backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend envía un error estructurado, lánzalo directamente
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    // Si no, lanza el error original
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authApi = {
  register(data: RegisterData) {
    // data: { ci, name, lastName, email, password }
    return api.post('/auth/register', data);
  },
  login(data: LoginData) {
    // data: { email, password }
    return api.post('/auth/login', data);
  },
};
