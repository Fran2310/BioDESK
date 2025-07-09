// Servicio para interactuar con la API de roles y permisos
import { roleApi } from './api'
import type { CreateRoleData } from './interfaces/role'

// Tipos para el componente
export interface ApiRolePermission {
  subject: string
  actions: string[]
}

export interface RoleFromApi {
  id: string
  role: string
  description: string
  permissions: ApiRolePermission[]
}

export interface CreateRolePayload {
  name: string
  description: string
  permissions: { subject: string; actions: string }[]
}

// Este es el tipo que tu API `assignPermissionsApi` espera
export type FlatPermissionsArray = string[]; // Ej: ['user:READ', 'patient:CREATE']

export async function getRoles(): Promise<RoleFromApi[]> {
  const query = {
    offset: 0,
    limit: 10,
  };
  const { data } = await roleApi.getRoles(query);
  // Si la respuesta es { results: [...] }, devuelve data.results
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.results)) {
    return data.results;
  }
  // Si la respuesta es { data: [...] }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  // Si no es ninguno de los anteriores, devuelve array vacío
  return [];
}

// Modificado para aceptar 'description'
export async function createRoleApi(payload: CreateRolePayload): Promise<RoleFromApi> {
  const { data } = await roleApi.createRole(payload as unknown as CreateRoleData)
  return data
}

// Esta función recibe un array plano de strings (ej. 'user:read')
export async function assignPermissionsApi(
  roleId: string,
  permissions: { subject: string; actions: string }[]
): Promise<any> {
  //updateRoleApi para actualizar los permisos
  return updateRoleApi(roleId, { permissions })
}

// También podrías necesitar un endpoint para actualizar nombre/descripción de un rol
export async function updateRoleApi(
  roleId: string,
  payload: Partial<CreateRolePayload>
): Promise<RoleFromApi> {
  // Si hay permisos, transforma actions de string a string (separado por comas)
  let fixedPayload: any = { ...payload };
  if (payload.permissions) {
    fixedPayload.permissions = payload.permissions.map(p => ({
      subject: p.subject,
      actions: p.actions, // actions ya es string separado por comas
    }));
  }
  const { data } = await roleApi.updateRole(roleId, fixedPayload);
  return data;
}

export async function deleteRoleApi(roleId: string): Promise<void> {
  await roleApi.deleteRole(roleId)
}

// Obtiene todos los permisos posibles (si tuvieras un endpoint, aquí lo usarías)
// Por ahora, puedes obtenerlos de los roles existentes
export async function getPermissions(): Promise<Record<string, any[]>> {
  const roles = await getRoles()
  const allPermissions = roles.flatMap(role => role.permissions || [])
  const groups: Record<string, any[]> = {}
  allPermissions.forEach((perm) => {
    if (!groups[perm.subject]) groups[perm.subject] = []
    groups[perm.subject].push({
      value: `${perm.subject}:${perm.actions[0]}`,
      label: `${perm.subject}:${perm.actions[0]}`
    })
  })
  return groups
}
