import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API_PROD, // Cambia según el backend en uso
  headers: {
    'Content-Type': 'application/json',
  },
});

// Servicio de autenticación
export const authApi = {
  register(data: any) {
    // data: { ci, name, lastName, email, password }
    return api.post('/auth/register', data);
  },
  login(data: any) {
    // data: { email, password }
    return api.post('/auth/login', data);
  },
};
