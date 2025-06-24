import axios from 'axios';
import type {
  RegisterData,
  LoginData,
  SendTokenData,
  ResetPasswordData,
} from './interfaces/auth';
import type { RegisterLabData } from './interfaces/lab';
import { useAuthStore } from '@/stores/authStore';
import { sessionNotFoundToast, labNotFoundToast } from '@/views/auth/toast';
import router from '@/router';
import { useLabStore } from '@/stores/labStore';
import type { GetBaseQuerys } from './interfaces/global';
import type { CreateRoleData } from './interfaces/role';
import { mapPermissionsFormat, validateLogoFile } from './utils';

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL_API_PROD, // Cambia según el backend en uso
  headers: {
    accept: 'application/json',
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

// Interceptor para añadir autenticación a todas las rutas menos a las publicas (auth)
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    // No agregar el token a rutas públicas (auth)
    if (!config.url?.startsWith('/auth')) {
      if (!token) {
        sessionNotFoundToast();
        router.push('/auth/login');
        // Lanzar un error para bloquear la petición
        return Promise.reject(new Error('Sesión no encontrada'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function headerLabId() {
  const labStore = useLabStore();
  const labId = labStore.currentLab?.id;

  if (!labId) {
    labNotFoundToast();
    router.push('/auth/login');
    throw new Error('Laboratorio no seleccionado');
  }

  return {
    headers: { 'x-lab-id': labId },
  };
}

/**
 * authApi
 * Servicio para la autenticación y recuperación de cuenta de usuario.
 *
 * Métodos:
 * - register: Registra un nuevo usuario.
 * - login: Inicia sesión con email y contraseña.
 * - sendToken: Envía un token de recuperación de contraseña al email.
 * - resetPassword: Restablece la contraseña usando el token recibido.
 */
export const authApi = {
  /**
   * Registra un nuevo usuario.
   * @param data Objeto con los datos de registro: { ci, name, lastName, email, password }
   * @returns Promesa de la respuesta del backend.
   */
  register(data: RegisterData) {
    return api.post('/auth/register', data);
  },

  /**
   * Inicia sesión de usuario.
   * @param data Objeto con email y password: { email, password }
   * @returns Promesa de la respuesta del backend.
   */
  login(data: LoginData) {
    return api.post('/auth/login', data);
  },

  /**
   * Envía un token de recuperación de contraseña al email proporcionado.
   * @param data Objeto con el email: { email }
   * @returns Promesa de la respuesta del backend.
   */
  sendToken(data: SendTokenData) {
    return api.post('/auth/send-token', data);
  },

  /**
   * Restablece la contraseña usando el token recibido por email.
   * @param data Objeto con email, token y nueva contraseña: { email, token, newPassword }
   * @returns Promesa de la respuesta del backend.
   */
  resetPassword(data: ResetPasswordData) {
    return api.post('/auth/reset-password', data);
  },
};

/**
 * labApi
 * Servicio para la gestión de laboratorios.
 *
 * Métodos:
 * - createLab: Crea un nuevo laboratorio.
 * - getUserLabs: Obtiene la lista de laboratorios asociados al usuario autenticado.
 * - uploadLogo: Sube el logo de un laboratorio seleccionado.
 */
export const labApi = {
  /**
   * Obtiene la lista de laboratorios asociados al usuario autenticado.
   * @returns Promesa de la respuesta del backend.
   */
  getUserLabs() {
    return api.get('/labs');
  },

  /**
   * Obtiene los datos del laboratorio actual, usa el labStorage.
   * @returns Promesa de la respuesta del backend.
   */
  getDataLab() {
    return api.get('/labs/this', headerLabId());
  },

  /**
   * Crea un nuevo laboratorio.
   * @param data Objeto con los datos del laboratorio a registrar.
   * @returns Promesa de la respuesta del backend.
   */
  createLab(data: RegisterLabData) {
    return api.post('/labs', data);
  },

  /**
   * Sube el logo del laboratorio actualmente seleccionado.
   * @param file Archivo de imagen (logo) a subir.
   * @returns Promesa de la respuesta del backend.
   */
  async uploadLogo(file: File) {
    await validateLogoFile(file);
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/labs/logo', formData, headerLabId());
  },
};

export const userApi = {};

/**
 * roleApi
 * Servicio para la gestión de roles y permisos de laboratorio.
 *
 * Métodos:
 * - getRoles: Obtiene los roles del laboratorio con queries opcionales.
 * - getRoleById: Obtiene un rol específico por su id.
 * - getRoleUsers: Obtiene los usuarios asociados a un rol específico.
 * - createRole: Crea un nuevo rol (convierte actions y fields a string).
 * - updateRole: Actualiza un rol existente (convierte actions y fields a string).
 * - deleteRole: Elimina un rol específico por su id.
 */
export const roleApi = {
  /**
   * Obtiene los roles del laboratorio con queries opcionales.
   * @param query querys de búsqueda y paginación.
   */
  getRoles(query?: GetBaseQuerys) {
    return api.get('/roles', {
      ...headerLabId(),
      params: query,
    });
  },

  /**
   * Obtiene un rol específico por su id.
   * @param id ID del rol a consultar.
   */
  getRoleById(id: string) {
    return api.get(`/roles/${id}`, headerLabId());
  },

  /**
   * Obtiene los usuarios asociados a un rol específico, con queries de paginación y búsqueda.
   * @param id ID del rol.
   * @param query Parámetros de búsqueda y paginación.
   */
  getRoleUsers(id: string, query: GetBaseQuerys) {
    return api.get(`/roles/${id}/users`, {
      ...headerLabId(),
      params: query,
    });
  },

  /**
   * Crea un nuevo rol, ajustando el formato de actions y fields a string para el backend.
   * @param data Datos del rol a crear.
   */
  createRole(data: CreateRoleData) {
    // Transformar actions y fields de array a string separados por coma
    const permissions = mapPermissionsFormat(data.permissions);
    return api.post('/roles', { ...data, permissions }, headerLabId());
  },

  /**
   * Actualiza un rol existente.
   * @param id ID del rol a actualizar.
   * @param data Campos a actualizar (al menos uno requerido).
   */
  updateRole(id: string, data: Partial<CreateRoleData>) {
    // Transformar actions y fields de array a string si existen
    const permissions = data.permissions
      ? mapPermissionsFormat(data.permissions)
      : undefined;

    // Solo incluye permissions si fue enviado
    const body = permissions ? { ...data, permissions } : data;

    return api.patch(`/roles/${id}`, body, headerLabId());
  },

  /**
   * Elimina un rol específico por su id.
   * @param id ID del rol a eliminar.
   */
  deleteRole(id: string) {
    return api.delete(`/roles/${id}`, headerLabId());
  },
};

export const auditApi = {};

export const medicTestCatalogApi = {};

export const medicHistoryApi = {};

export const patientApi = {};

export const medicTestRequestApi = {};
