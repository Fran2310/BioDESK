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
import type { GetBaseQuerys, GetExtendQuerys } from './interfaces/global';
import type { CreateRoleData } from './interfaces/role';
import { mapPermissionsFormat, validateLogoFile } from './utils';
import type { PatientData } from './interfaces/patient';
import type { MedicHistoryData } from './interfaces/medicHistory';
import type { CreateMedicTestCatalogData } from './interfaces/medicTestCatalog';

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

// en construccion, todavia faltan endpoints
export const userApi = {
  /**
   * Obtiene los datos del usuario actual logueado
   * @returns Promesa de la respuesta del backend.
   */
  getMe() {
    return api.get(`/users/me`, headerLabId());
  },
};

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

/**
 * auditApi
 * Servicio para la consulta de logs de auditoría del laboratorio.
 *
 * Métodos:
 * - getAuditLogs: Obtiene los logs de auditoría del laboratorio, con soporte para queries de búsqueda y paginación.
 */
export const auditApi = {
  /**
   * Obtiene los logs de auditoría del laboratorio.
   * @param query Parámetros de búsqueda, paginación y el flag includeData.
   * @returns Promesa de la respuesta del backend.
   */
  getAuditLogs(query: GetExtendQuerys) {
    return api.get('/audit/logs', {
      ...headerLabId(),
      params: query,
    });
  },
};

/**
 * medicTestCatalogApi
 * Servicio para la gestión del catálogo de exámenes médicos del laboratorio.
 *
 * Métodos:
 * - getMedicTestCatalogById: Obtiene un examen médico específico del catálogo por su ID.
 * - getMedicTestCatalog: Obtiene el catálogo general de pruebas médicas del laboratorio, con soporte para queries de búsqueda y paginación.
 * - createMedicTestCatalog: Crea un nuevo examen médico en el catálogo del laboratorio.
 * - deleteMedicTestCatalog: Elimina un examen médico del catálogo por su ID.
 * - putMedicTestCatalog: Actualiza un examen médico existente en el catálogo del laboratorio (re-escribe todos los campos).
 */
export const medicTestCatalogApi = {
  /**
   * Obtiene un examen médico específico del catálogo por su ID.
   * @param id ID del examen médico.
   * @param includeData Si se debe incluir datos extendidos en la respuesta.
   * @returns Promesa de la respuesta del backend.
   */
  getMedicTestCatalogById(id: string, includeData: boolean) {
    return api.get(`/medic-tests-catalog/${id}`, {
      ...headerLabId(),
      params: { includeData },
    });
  },

  /**
   * Obtiene el catálogo general de pruebas médicas para el alboratorio
   * @param query - Parámetros de consulta extendidos (GetExtendQuerys)
   * @returns Promise con la respuesta del API
   */
  getMedicTestCatalog(query: GetExtendQuerys) {
    return api.get('/medic-tests-catalog/', {
      ...headerLabId(),
      params: query,
    });
  },

  /**
   * Crea un nuevo examen médico en el catálogo del laboratorio.
   * @param data Objeto con los datos del examen médico a crear.
   * @returns Promesa de la respuesta del backend.
   */
  createMedicTestCatalog(data: CreateMedicTestCatalogData) {
    return api.post('/medic-tests-catalog/', data, headerLabId());
  },

  /**
   * Elimina un examen médico del catálogo por su ID.
   * @param id ID del examen médico a eliminar.
   * @returns Promesa de la respuesta del backend.
   */
  deleteMedicTestCatalog(id: string) {
    return api.delete(`/medic-tests-catalog/${id}`, headerLabId());
  },

  /**
   * Actualiza un examen médico existente en el catálogo del laboratorio.
   * El ID del examen se pasa como parámetro de consulta (?id=).
   * Los campos que no se envían en el cuerpo de la solicitud no se actualizarán.
   * Asegúrate de enviar todos los campos del catálogo, ya que la actualización re-escribe todo el examen.
   * @param id ID del examen médico a actualizar.
   * @param data Objeto con los datos completos del examen médico.
   * @returns Promesa de la respuesta del backend.
   */
  putMedicTestCatalog(id: string, data: CreateMedicTestCatalogData) {
    return api.put(`/medic-tests-catalog/${id}`, data, headerLabId());
  },
};

/**
 * medicHistoryApi
 * Servicio para la gestión del historial médico de los pacientes.
 *
 * Métodos:
 * - getMedicHistory: Obtiene el historial médico de un paciente específico.
 * - updateMedicHistory: Actualiza el historial médico de un paciente (re-escribe el campo completo).
 */
export const medicHistoryApi = {
  /**
   * Obtiene el historial médico de un paciente específico.
   * @param patientId ID del paciente.
   * @param includeData Si se debe incluir datos de los request de examenes del paciente o no (obligatorio).
   * @returns Promesa de la respuesta del backend.
   */
  getMedicHistory(patientId: string, includeData: boolean) {
    return api.get(`/patients/${patientId}/medic-history`, {
      ...headerLabId(),
      params: { includeData },
    });
  },

  /**
   * Actualiza el historial médico de un paciente específico. se mandan solo los campos a actualizar, pero el campo a actualizar debe mandarse todos los datos nuevos, ya que re escribe el campo entero
   * @param patientId ID del paciente.
   * @param data Objeto con los campos array de string a actualizar: { allergies?, pathologies? }
   * @returns Promesa de la respuesta del backend.
   */
  updateMedicHistory(patientId: string, data: MedicHistoryData) {
    return api.patch(
      `/patients/${patientId}/medic-history`,
      data,
      headerLabId()
    );
  },
};

/**
 * patientApi
 * Servicio para la gestión de pacientes del laboratorio.
 *
 * Métodos:
 * - getPatientById: Obtiene los datos de un paciente específico por su id.
 * - getPatientWithMedicHistory: Obtiene los datos completos de un paciente, incluyendo su historial médico detallado.
 * - getPatients: Obtiene la lista de pacientes del laboratorio, con soporte para queries de búsqueda y paginación.
 * - createPatient: Crea un nuevo paciente en el laboratorio.
 * - updatePatient: Actualiza los datos de un paciente específico.
 * - deletePatient: Elimina un paciente específico por su id (incluye advertencia sobre la eliminación de historial médico y requests asociados).
 */
export const patientApi = {
  /**
   * Obtiene los datos de un paciente específico por su id.
   * @param id ID del paciente.
   * @returns Promesa de la respuesta del backend.
   */
  getPatientById(id: string) {
    return api.get(`/patients/${id}`, headerLabId());
  },

  /**
   * Obtiene los datos completos de un paciente incluyendo su historial médico detallado.
   * @param patientId ID del paciente.
   * @param includeData Si se debe incluir datos extendidos en el historial médico.
   * @returns Promesa con los datos del paciente y su historial médico completo integrado.
   */
  async getPatientWithMedicHistory(patientId: string, includeData: boolean) {
    try {
      // Peticiones en paralelo para mejor rendimiento
      const [patientResponse, medicHistoryResponse] = await Promise.all([
        this.getPatientById(patientId),
        medicHistoryApi.getMedicHistory(patientId, includeData),
      ]);

      const patientData = patientResponse.data;
      const medicHistoryData = medicHistoryResponse.data;

      // Remover el patientId del historial médico para evitar redundancia
      const { patientId: _, ...cleanMedicHistory } = medicHistoryData;

      // Integrar el historial médico completo en los datos del paciente
      return {
        ...patientData,
        medicHistory: cleanMedicHistory,
      };
    } catch (error) {
      // Re-lanza el error para que sea manejado por el componente que llama la funcion
      throw error;
    }
  },

  /**
   * Obtiene la lista de pacientes del laboratorio.
   * @param query Parámetros de búsqueda, paginación y el flag includeData.
   * @returns Promesa de la respuesta del backend.
   */
  getPatients(query: GetExtendQuerys) {
    return api.get('/patients', {
      ...headerLabId(),
      params: query,
    });
  },
  /**
   * Crea un nuevo paciente.
   * @param data Objeto con los datos del paciente a registrar.
   * @returns Promesa de la respuesta del backend.
   */
  createPatient(data: PatientData) {
    return api.post('/patients', data, headerLabId());
  },

  /**
   * Actualiza los datos de un paciente específico.
   * @param id ID del paciente a actualizar.
   * @param data Campos a actualizar (todos opcionales).
   * @returns Promesa de la respuesta del backend.
   */
  updatePatient(id: string, data: Partial<PatientData>) {
    return api.patch(`/patients/${id}`, data, headerLabId());
  },

  /**
   * Elimina un paciente específico por su id.
   * @param id ID del paciente a eliminar.
   * @returns Promesa de la respuesta del backend.
   * @warning Este metodo elimina directamente el historial medico * entero del paciente con todos sus requests de medic tests. Se * le debe notificar al usuario que esta operacion es peligrosa
   */
  deletePatient(id: string) {
    return api.delete(`/patients/${id}`, headerLabId());
  },
};

export const medicTestRequestApi = {};
