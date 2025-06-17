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
}