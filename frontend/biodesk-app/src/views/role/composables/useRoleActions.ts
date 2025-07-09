// Composable para acciones de roles: crear, eliminar, helpers de botones y formularios
import { ref, computed } from 'vue'

export function useRoleActions({
  newRoleName,
  newRoleDescription,
  permissions,
  createRoleApi,
  fetchAllRoles,
  showNewRoleModal
}: any) {
  // Guardar nuevo rol
  const createRole = async () => {
    if (!newRoleName.value || !newRoleDescription.value) return
    const perms = permissions.value
      .filter((p: any) => p.subject && p.actions && p.actions.length > 0)
      .map((p: any) => ({
        subject: p.subject,
        actions: Array.isArray(p.actions) ? p.actions.join(',') : p.actions,
        ...(p.fields && Array.isArray(p.fields) && p.fields.length > 0
          ? { fields: p.fields.join(',') }
          : {})
      }))
    if (perms.length === 0) return
    const payload = {
      name: newRoleName.value,
      description: newRoleDescription.value,
      permissions: perms,
    }
    await createRoleApi(payload)
    newRoleName.value = ''
    newRoleDescription.value = ''
    permissions.value = []
    showNewRoleModal.value = false
    await fetchAllRoles()
  }

  // Botón guardar nuevo rol
  const canSaveNewRole = computed(() => {
    if (!newRoleName.value.trim() || !newRoleDescription.value.trim()) return false
    if (!permissions.value.length) return false
    for (const p of permissions.value) {
      if (!p.subject || !p.actions || !Array.isArray(p.actions) || p.actions.length === 0) return false
    }
    return true
  })

  return {
    createRole,
    canSaveNewRole
  }
}
