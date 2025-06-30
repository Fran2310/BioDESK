<template>
  <div class="role-management">
    <h1 class="text-2xl font-bold mb-4">Gestión de Roles</h1>
    <div class="mb-6">
      <label class="block mb-2 font-semibold">Nombre del nuevo rol</label>
      <input v-model="newRoleName" class="input input-bordered w-full max-w-xs" placeholder="Ej: Administrador" />
      <label class="block mb-2 font-semibold mt-2">Descripción</label>
      <input v-model="newRoleDescription" class="input input-bordered w-full max-w-xs" placeholder="Descripción del rol" />
      <label class="block mb-2 font-semibold mt-2">Permisos</label>
      <div v-for="(perm, idx) in dynamicPermissions" :key="idx" class="flex gap-2 mb-2 items-center">
        <input
          v-model="perm.subject"
          class="input input-bordered input-xs"
          placeholder="Subject (ej: RequestMedicTest)"
        />
        <input
          v-model="perm.actions"
          class="input input-bordered input-xs"
          placeholder="Actions (ej: read,update)"
        />
        <input
          v-model="perm.fields"
          class="input input-bordered input-xs"
          placeholder="Fields (ej: status,results)"
        />
        <button class="btn btn-error btn-xs" @click="removePermission(idx)">Eliminar</button>
      </div>
      <button class="btn btn-secondary btn-xs mb-2" @click="addPermission">Agregar Permiso</button>
      <button class="btn btn-primary ml-2 mt-2" @click="createRole">Crear Rol</button>
    </div>
    <div>
      <h2 class="text-xl font-semibold mb-2">Roles existentes</h2>
      <ul>
        <li v-for="role in roles" :key="role.id" class="mb-2 flex items-center gap-2">
          <template v-if="editingRoleId === role.id">
            <input v-model="editRoleFields[role.id].name" class="input input-bordered w-32" />
            <input v-model="editRoleFields[role.id].description" class="input input-bordered w-48" />
            <button class="btn btn-success btn-xs" @click="saveEditRole(role)">Guardar</button>
            <button class="btn btn-secondary btn-xs" @click="cancelEditRole">Cancelar</button>
          </template>
          <template v-else>
            <span class="font-bold">{{ role.role }}</span>
            <span class="ml-2 text-sm text-gray-500">{{ role.description }}</span>
            <span class="ml-2 text-sm text-gray-500">
              Permisos:
              <span v-if="Array.isArray(role.permissions)">
                {{ role.permissions.map((p: ApiRolePermission) =>
                  Array.isArray(p.actions)
                    ? p.actions.map((a: string) => `${p.subject}:${a}`).join(', ')
                    : typeof p.actions === 'string'
                      ? (p.actions as string).split(',').map((a: string) => `${p.subject}:${a.trim()}`).join(', ')
                      : ''
                ).join(', ') }}
              </span>
            </span>
            <button class="btn btn-warning btn-xs ml-2" @click="openEditModal(role)">Editar</button>
            <button class="btn btn-error btn-xs ml-1" @click="deleteRole(role.id)">Eliminar</button>
          </template>
        </li>
      </ul>
    </div>
    <div v-if="showEditModal" class="modal-backdrop">
      <div class="modal">
        <h2 class="text-xl font-semibold mb-2">Editar Rol</h2>
        <label class="block mb-2 font-semibold">Nombre</label>
        <input v-model="editRoleData.name" class="input input-bordered w-full max-w-xs" />
        <label class="block mb-2 font-semibold mt-2">Descripción</label>
        <input v-model="editRoleData.description" class="input input-bordered w-full max-w-xs" />
        <label class="block mb-2 font-semibold mt-2">Permisos</label>
        <div v-for="(perm, idx) in editRoleData.permissions" :key="idx" class="flex gap-2 mb-2 items-center">
          <input
            v-model="perm.subject"
            class="input input-bordered input-xs"
            placeholder="Subject (ej: RequestMedicTest)"
          />
          <input
            v-model="perm.actions"
            class="input input-bordered input-xs"
            placeholder="Actions (ej: read,update)"
          />
          <input
            v-model="perm.fields"
            class="input input-bordered input-xs"
            placeholder="Fields (ej: status,results)"
          />
          <button class="btn btn-error btn-xs" @click="removeEditPermission(idx)">Eliminar</button>
        </div>
        <button class="btn btn-secondary btn-xs mb-2" @click="addEditPermission">Agregar Permiso</button>
        <div class="flex gap-2 mt-4">
          <button class="btn btn-success" @click="saveEditRoleModal">Guardar</button>
          <button class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
// Importa las funciones del servicio y los tipos que acabamos de definir
import {
  getRoles,
  createRoleApi,
  assignPermissionsApi,
  getPermissions,
  updateRoleApi,
  deleteRoleApi,
} from '../services/roleService' // Asegúrate de que la ruta sea correcta

import type {
  RoleFromApi,
  ApiRolePermission,
  CreateRolePayload,
  FlatPermissionsArray
} from '../services/roleService' 



const newRoleName = ref('')
const newRoleDescription = ref('')
const selectedPermissions = ref<string[]>([]) // Esto sigue siendo string[] ('subject:action')
const roles = ref<RoleFromApi[]>([]) // Ahora tipado correctamente
const permissionGroups = ref<Record<string, any[]>>({}) // Tipado más específico
const selectedRoleId = ref<string | null>(null)

// Edición de roles
const editingRoleId = ref<string | null>(null)
const editRoleFields = ref<Record<string, { name: string; description: string }>>({});
const permissionFields = ref<Record<string, string>>({}); // Nuevo: campos por permiso

const dynamicPermissions = ref([
  { subject: '', actions: '', fields: '' }
]);

const fetchAllRoles = async () => {
  try {
    const res = await getRoles();
    console.log('Respuesta de getRoles:', res); // <-- ¿Es un array?
    roles.value = res || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    alert('Error al cargar roles.');
  }
}

const fetchAllPermissions = async () => {
  try {
    // Usa el helper del servicio, que ya llama a getRoles y agrupa los permisos
    permissionGroups.value = await getPermissions();
    // Si quieres también refrescar la lista de roles:
    roles.value = await getRoles();
  } catch (error) {
    console.error('Error fetching permissions:', error);
    alert('Error al cargar permisos.');
  }
}

// Utilidad para agrupar permisos y convertirlos al formato correcto
function groupPermissions(flatPermissions: string[]) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(','), // string separado por comas
    // fields: "*" // Si necesitas enviar fields, agrégalo aquí
  }));
}

function groupPermissionsWithFields(flatPermissions: string[]) {
  const grouped: Record<string, Set<string>> = {};
  flatPermissions.forEach((perm) => {
    const [subject, action] = perm.split(':');
    if (!grouped[subject]) grouped[subject] = new Set();
    grouped[subject].add(action);
  });
  // Devuelve el formato esperado por la API, incluyendo fields
  return Object.entries(grouped).map(([subject, actions]) => ({
    subject,
    actions: Array.from(actions).join(','), // string separado por comas
    fields: Object.entries(permissionFields.value)
      .filter(([key]) => key.startsWith(subject + ':'))
      .map(([, fields]) => fields)
      .filter(Boolean)[0] || undefined, // Toma el campo si existe
  }));
}

function addPermission() {
  dynamicPermissions.value.push({ subject: '', actions: '', fields: '' });
}

function removePermission(idx: number) {
  dynamicPermissions.value.splice(idx, 1);
}

const createRole = async () => {
  if (!newRoleName.value || !newRoleDescription.value) {
    alert('El nombre y la descripción del rol son obligatorios.')
    return
  }
  // Filtra permisos vacíos
  const permissions = dynamicPermissions.value
    .filter(p => p.subject && p.actions)
    .map(p => ({
      subject: p.subject,
      actions: p.actions,
      ...(p.fields ? { fields: p.fields } : {})
    }));
  if (permissions.length === 0) {
    alert('Debes agregar al menos un permiso válido.')
    return
  }
  try {
    const payload = {
      name: newRoleName.value,
      description: newRoleDescription.value,
      permissions,
    };
    await createRoleApi(payload)
    newRoleName.value = ''
    newRoleDescription.value = ''
    dynamicPermissions.value = [{ subject: '', actions: '', fields: '' }]
    await fetchAllRoles() // Recargar roles
    alert('Rol creado con éxito.')
  } catch (error) {
    console.error('Error creating role:', error)
    alert('Error al crear el rol.')
  }
}

const assignPermissions = async () => {
  if (!selectedRoleId.value) {
    alert('Por favor, selecciona un rol primero.')
    return
  }
  try {
    const permissions = groupPermissions(selectedPermissions.value);
    await assignPermissionsApi(selectedRoleId.value, permissions);
    selectedPermissions.value = []
    await fetchAllRoles() // Recargar roles para ver los cambios
    alert('Permisos asignados con éxito.')
  } catch (error) {
    console.error('Error assigning permissions:', error)
    alert('Error al asignar permisos.')
  }
}

// Edición de roles
function startEditRole(role: RoleFromApi) {
  editingRoleId.value = role.id;
    editRoleFields.value[role.id] = {
    name: role.role,
    description: role.description,
    };
}


const saveEditRole = async (role: RoleFromApi) => {
  const fields = editRoleFields.value[role.id]
  if (!fields.name || !fields.description) {
    alert('El nombre y la descripción no pueden estar vacíos.')
    return
  }
  try {
    // Si quieres permitir editar permisos junto con nombre/desc, usa selectedPermissions
    const permissions = groupPermissions(selectedPermissions.value)
    const payload = {
      name: fields.name,
      description: fields.description,
      permissions, // [{ subject: 'RequestMedicTest', actions: 'read,update' }]
    }
    await updateRoleApi(role.id, payload)
    editingRoleId.value = null
    delete editRoleFields.value[role.id]
    await fetchAllRoles()
    alert('Rol actualizado con éxito.')
  } catch (error) {
    console.error('Error saving role:', error)
    alert('Error al actualizar rol.')
  }
}

const cancelEditRole = () => {
  editingRoleId.value = null
  editRoleFields.value = {}
}

const deleteRole = async (roleId: string) => {
  if (confirm(`¿Seguro que deseas eliminar este rol?`)) {
    try {
      await deleteRoleApi(roleId)
      await fetchAllRoles()
      if (selectedRoleId.value === roleId) {
        selectedRoleId.value = null; // Deseleccionar si el rol actual fue eliminado
      }
      alert('Rol eliminado con éxito.')
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Error al eliminar rol.')
    }
  }
}

watch(selectedRoleId, (roleId) => {
  if (!roleId) {
    selectedPermissions.value = []
    return
  }
  const role = roles.value.find((r: RoleFromApi) => r.id === roleId)
  if (role && Array.isArray(role.permissions)) {
    // Aplanar los permisos del rol al formato 'subject:action' para los checkboxes
    selectedPermissions.value = role.permissions.flatMap((p: ApiRolePermission) =>
      p.actions.map((action: string) => `${p.subject}:${action}`)
    )
  } else {
    selectedPermissions.value = []
  }
}, { immediate: true }) // Ejecutar inmediatamente si ya hay un selectedRoleId al inicio

onMounted(async () => {
  await fetchAllPermissions()
})

const showEditModal = ref(false)
const editRoleId = ref<string | null>(null)
const editRoleData = ref<{ name: string; description: string; permissions: { subject: string; actions: string; fields?: string }[] }>({
  name: '',
  description: '',
  permissions: []
})

function openEditModal(role: RoleFromApi) {
  console.log('Rol recibido para editar:', role);
  editRoleId.value = role.id
  editRoleData.value.name = role.role
  editRoleData.value.description = role.description
  editRoleData.value.permissions = (role.permissions || []).map(p => ({
    subject: p.subject,
    actions: Array.isArray(p.actions) ? p.actions.join(',') : (p.actions ?? ''),
    fields: (p as any).fields ?? ''
  }))
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editRoleId.value = null
}

function addEditPermission() {
  editRoleData.value.permissions.push({ subject: '', actions: '', fields: '' })
}

function removeEditPermission(idx: number) {
  editRoleData.value.permissions.splice(idx, 1)
}

const saveEditRoleModal = async () => {
  if (!editRoleId.value) return
  const { name, description, permissions } = editRoleData.value
  if (!name || !description) {
    alert('El nombre y la descripción no pueden estar vacíos.')
    return
  }
  const cleanPermissions = permissions
    .filter(p => p.subject && p.actions)
    .map(p => ({
      subject: p.subject,
      actions: p.actions,
      ...(p.fields ? { fields: p.fields } : {})
    }))
  try {
    await updateRoleApi(editRoleId.value, {
      name,
      description,
      permissions: cleanPermissions
    })
    showEditModal.value = false
    editRoleId.value = null
    await fetchAllRoles()
    alert('Rol actualizado con éxito.')
  } catch (error) {
    alert('Error al actualizar rol.')
  }
}
</script>

<style scoped>
.role-management {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}
.input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
</style>