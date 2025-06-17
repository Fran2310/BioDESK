/* const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export default {
  allUsers: () => `${apiBaseUrl}/users`,
  user: (id: string) => `${apiBaseUrl}/users/${id}`,
  users: ({ page, pageSize }: { page: number; pageSize: number }) =>
    `${apiBaseUrl}/users/?page=${page}&pageSize=${pageSize}`,
  allProjects: () => `${apiBaseUrl}/projects`,
  project: (id: string) => `${apiBaseUrl}/projects/${id}`,
  projects: ({ page, pageSize }: { page: number; pageSize: number }) =>
    `${apiBaseUrl}/projects/?page=${page}&pageSize=${pageSize}`,
  avatars: () => `${apiBaseUrl}/avatars`,
}
 */

// /src/services/api.ts

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export default {
  // Users
  allUsers: () => `${apiBaseUrl}/users`,
  user: (id: string) => `${apiBaseUrl}/users/${id}`,
  users: ({ page, pageSize }: { page: number; pageSize: number }) =>
    `${apiBaseUrl}/users/?page=${page}&pageSize=${pageSize}`,

  // Patients – UPDATE THIS TO MATCH YOUR NESTJS ENDPOINT
  allPatients: () => `${apiBaseUrl}/patients`, // GET /patients
  patient: (id: string) => `${apiBaseUrl}/patients/${id}`, // GET/PUT/DELETE /patients/:id
  patients: ({ page, pageSize }: { page: number; pageSize: number }) =>
    `${apiBaseUrl}/patients?page=${page}&limit=${pageSize}`,

  // Projects (if needed)
  allProjects: () => `${apiBaseUrl}/projects`,
  project: (id: string) => `${apiBaseUrl}/projects/${id}`,
  projects: ({ page, pageSize }: { page: number; pageSize: number }) =>
    `${apiBaseUrl}/projects?page=${page}&limit=${pageSize}`,

  //Avatars
  avatars: () => `${apiBaseUrl}/patients/upload-avatar`, // or similar endpoint

  //Laboratory catalog
  medicTestCatalog: (labId: string) => `${apiBaseUrl}/laboratories/${labId}/medic-test-catalog`,
  medicTest: (id: number) => `${apiBaseUrl}/medic-test-catalog/${id}`,
}



import { useAuthStore } from '../stores/authStore';

const labId = localStorage.getItem('Id'); // Obtén el ID del laboratorio desde localStorage
const token = localStorage.getItem('token'); // Obtén el token desde localStorage

export const fetchMedicTests = async (labId: string, token: string) => {
  const response = await fetch(`${apiBaseUrl}/laboratories/${labId}/medic-test-catalog`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Incluye el token como Bearer,
      'X-Laboratory-ID': labId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Error al obtener los exámenes');
  return response.json();
};

export const addMedicTest = async (labId: string, test: any, token: string) => {
  const response = await fetch(`${apiBaseUrl}/laboratories/${labId}/medic-test-catalog/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Token para autenticación
      'X-Laboratory-ID': labId,          // ID del laboratorio
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(test),
  });

  if (!response.ok) throw new Error('Error al agregar el examen');
  return response.json();
};

export const updateMedicTest = async (labId: string, id: number, test: any, token: string) => {
  const response = await fetch(`${apiBaseUrl}/laboratories/${labId}/medic-test-catalog/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`, // Token para autenticación
      'X-Laboratory-ID': labId,          // ID del laboratorio
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(test),
  });

  if (!response.ok) throw new Error('Error al actualizar el examen');
  return response.json();
};

export const deleteMedicTest = async (labId: string, id: number, token: string) => {
  const response = await fetch(`${apiBaseUrl}/laboratories/${labId}/medic-test-catalog/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`, // Token para autenticación
      'X-Laboratory-ID': labId,          // ID del laboratorio
    },
  });

  if (!response.ok) throw new Error('Error al eliminar el examen');
};