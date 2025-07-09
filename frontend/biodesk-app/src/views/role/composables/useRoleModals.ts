// Composable para lógica de modales de roles
import { ref } from 'vue'
import type { RoleFromApi } from '../../../services/roleService'

export function useRoleModals() {
  const showNewRoleModal = ref(false)
  const showEditRoleModal = ref(false)
  const showRoleDetailsModal = ref(false)
  const selectedRole = ref<RoleFromApi | null>(null)
  const editRoleIdForModal = ref<string | null>(null)
  const editRoleModalData = ref<{ name: string; description: string; permissions: { subject: string; actions: string; fields?: string }[]; newPermission?: any }>({
    name: '',
    description: '',
    permissions: [{ subject: '', actions: '', fields: '' }],
    newPermission: { subject: '', actions: [], fields: [] }
  })

  function openEditRoleModal(role: RoleFromApi) {
    showEditRoleModal.value = true
    editRoleIdForModal.value = role.id
    editRoleModalData.value.name = role.role
    editRoleModalData.value.description = role.description
    editRoleModalData.value.permissions = (role.permissions || []).map(p => ({
      subject: p.subject,
      actions: Array.isArray(p.actions) ? p.actions.join(',') : (p.actions ?? ''),
      fields: (p as any).fields ?? ''
    }))
    editRoleModalData.value.newPermission = { subject: '', actions: [], fields: [] }
  }

  function closeEditRoleModal() {
    showEditRoleModal.value = false
    editRoleIdForModal.value = null
    editRoleModalData.value.name = ''
    editRoleModalData.value.description = ''
    editRoleModalData.value.permissions = [{ subject: '', actions: '', fields: '' }]
    editRoleModalData.value.newPermission = { subject: '', actions: [], fields: [] }
  }

  function closeNewRoleModal(resetRoleForm: () => void) {
    showNewRoleModal.value = false
    resetRoleForm()
  }

  function addEditRoleModalPermission() {
    // Only add if newPermission has a subject and actions
    const perm = editRoleModalData.value.newPermission
    if (!perm || !perm.subject || !perm.actions || (Array.isArray(perm.actions) && perm.actions.length === 0)) return
    // Clone and normalize actions/fields to string for consistency
    const newPerm = {
      subject: perm.subject,
      actions: Array.isArray(perm.actions) ? perm.actions.join(',') : perm.actions,
      fields: Array.isArray(perm.fields) ? perm.fields.join(',') : (perm.fields || '')
    }
    // Replace array to trigger reactivity
    editRoleModalData.value.permissions = [
      ...editRoleModalData.value.permissions,
      newPerm
    ]
    // Reset newPermission
    editRoleModalData.value.newPermission = { subject: '', actions: [], fields: [] }
  }

  function removeEditRoleModalPermission(idx: number) {
    editRoleModalData.value.permissions.splice(idx, 1)
  }

  return {
    showNewRoleModal,
    showEditRoleModal,
    showRoleDetailsModal,
    selectedRole,
    editRoleIdForModal,
    editRoleModalData,
    openEditRoleModal,
    closeEditRoleModal,
    closeNewRoleModal,
    addEditRoleModalPermission,
    removeEditRoleModalPermission
  }
}
