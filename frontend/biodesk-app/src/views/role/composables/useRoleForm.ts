// Composable para lógica de formularios y helpers de roles
import { ref, computed, watch, onMounted } from 'vue'

export function useRoleForm({
  roles,
  fetchAllPermissions,
  fetchAllRoles,
  editRoleModalData,
  updateRoleApi,
  closeEditRoleModal,
  showNewRoleModal
}: any) {
  const newRoleName = ref('')
  const newRoleDescription = ref('')
  const selectedPermissions = ref<string[]>([])
  const selectedRoleId = ref<string | null>(null)
  const permissions = ref<any[]>([])
  const newPermission = ref({ subject: '', actions: [], fields: [] })

  function addPermission() {
    if (newPermission.value.subject && newPermission.value.actions.length > 0) {
      permissions.value.push({
        subject: newPermission.value.subject,
        actions: [...newPermission.value.actions],
        fields: [...newPermission.value.fields],
      })
      newPermission.value = { subject: '', actions: [], fields: [] }
    }
  }
  function removePermission(index: number) {
    permissions.value.splice(index, 1)
  }

  async function saveEditRoleModal(editRoleIdForModal: any) {
    if (!editRoleIdForModal.value) return;
    const { name, description, permissions } = editRoleModalData.value;
    if (!name || !description) return;
    const cleanPermissions = permissions
      .filter((p: any) => p.subject && p.actions)
      .map((p: any) => ({
        subject: p.subject,
        actions: Array.isArray(p.actions) ? p.actions.join(',') : p.actions,
        ...(p.fields && Array.isArray(p.fields) && p.fields.length > 0
          ? { fields: p.fields.join(',') }
          : {})
      }));
    await updateRoleApi(editRoleIdForModal.value, {
      name,
      description,
      permissions: cleanPermissions
    });
    closeEditRoleModal();
    await fetchAllRoles();
  }

  function resetRoleForm() {
    newRoleName.value = ''
    newRoleDescription.value = ''
    permissions.value = []
    newPermission.value = { subject: '', actions: [], fields: [] }
  }

  watch(selectedRoleId, (roleId) => {
    if (!roleId) {
      selectedPermissions.value = []
      return
    }
    const role = roles.value.find((r: any) => r.id === roleId)
    if (role && Array.isArray(role.permissions)) {
      selectedPermissions.value = role.permissions.flatMap((p: any) =>
        p.actions.map((action: string) => `${p.subject}:${action}`)
      )
    } else {
      selectedPermissions.value = []
    }
  }, { immediate: true })

  onMounted(async () => {
    await fetchAllPermissions()
  })

  return {
    newRoleName,
    newRoleDescription,
    selectedPermissions,
    selectedRoleId,
    permissions,
    newPermission,
    addPermission,
    removePermission,
    saveEditRoleModal,
    resetRoleForm
  }
}
