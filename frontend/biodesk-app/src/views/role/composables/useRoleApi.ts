// Composable para lógica de llamadas a la API de roles
import { ref } from 'vue'
import {
  getRoles,
  createRoleApi,
  assignPermissionsApi,
  getPermissions,
  updateRoleApi,
  deleteRoleApi,
} from '../../../services/roleService'
import type { RoleFromApi, ApiRolePermission, CreateRolePayload } from '../../../services/roleService'

export function useRoleApi() {
  const roles = ref<RoleFromApi[]>([])
  const permissionGroups = ref<Record<string, any[]>>({})
  const loadingRoles = ref(false)

  const fetchAllRoles = async () => {
    loadingRoles.value = true
    try {
      const res = await getRoles();
      roles.value = res || [];
    } catch (error) {
      alert('Error al cargar roles.');
    } finally {
      loadingRoles.value = false
    }
  }

  const fetchAllPermissions = async () => {
    loadingRoles.value = true
    try {
      permissionGroups.value = await getPermissions();
      roles.value = await getRoles();
    } catch (error) {
      alert('Error al cargar permisos.');
    } finally {
      loadingRoles.value = false
    }
  }

  const createRole = async (payload: CreateRolePayload) => {
    await createRoleApi(payload);
    await fetchAllRoles();
  }

  const updateRole = async (roleId: string, payload: any) => {
    await updateRoleApi(roleId, payload);
    await fetchAllRoles();
  }

  const deleteRole = async (roleId: string) => {
    if (confirm(`¿Seguro que deseas eliminar este rol?`)) {
      await deleteRoleApi(roleId);
      await fetchAllRoles();
    }
  }

  return {
    roles,
    permissionGroups,
    loadingRoles,
    fetchAllRoles,
    fetchAllPermissions,
    createRole,
    updateRole,
    deleteRole
  }
}
