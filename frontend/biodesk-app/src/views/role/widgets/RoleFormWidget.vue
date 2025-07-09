<template>
  <va-card class="w-full">
    <va-card-title>
      <span class="text-lg font-bold">{{ isEdit ? 'Editar rol' : 'Agregar nuevo rol' }}</span>
    </va-card-title>
    <va-card-content>
      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="block mb-1 font-semibold text-m">Nombre</label>
          <va-input
            v-model="roleName"
            class="w-full"
            placeholder="Ej: Administrador"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block mb-1 font-semibold text-m">Descripción</label>
          <va-input
            v-model="roleDescription"
            class="w-full"
            placeholder="Descripción del rol"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block mb-1 font-semibold text-m">Permisos</label>
          <div class="grid grid-cols-4 gap-2 m-2">
            <va-select
              v-model="newPermission.subject"
              :options="subjectOptions"
              placeholder="Área"
              size="small"
              class="col-span-1"
            />
            <va-select
              v-model="newPermission.actions"
              :options="actionsOptions"
              placeholder="Acciones"
              size="small"
              multiple
              class="col-span-1"
            />
            <va-select
              v-model="newPermission.fields"
              :options="getFieldsOptions(newPermission.subject)"
              placeholder="Campos"
              size="small"
              multiple
              class="col-span-1"
            />
            <va-button
              color="primary"
              size="small"
              @click.prevent="addPermission"
              class="col-span-1"
            >
              Agregar permiso
            </va-button>
          </div>

          <!-- Lista de permisos añadidos -->
          <div
            v-for="(permission, index) in permissions"
            :key="index"
            class="permission-block mt-4"
          >
            <div class="permission-header grid grid-cols-4 gap-2 items-center mb-2 w-full">
              <div class="col-span-1 font-semibold permission-name">
                {{ (permission as any).subject }}
              </div>
              <div class="col-span-1 permission-actions flex flex-wrap gap-1">
                <VaChip
                  v-for="(action, aIdx) in (Array.isArray((permission as any).actions) ? (permission as any).actions : String((permission as any).actions).split(','))"
                  :key="aIdx"
                  size="small"
                  color="primary"
                  class="mr-1 mb-1"
                >
                  {{ action }}
                </VaChip>
              </div>
              <div class="col-span-1 permission-fields flex flex-wrap gap-1">
                <VaChip
                  v-for="(field, fIdx) in (Array.isArray((permission as any).fields) ? (permission as any).fields : String((permission as any).fields || '').split(',').filter(f => f.trim() !== ''))"
                  :key="fIdx"
                  size="small"
                  color="info"
                  class="mr-1 mb-1"
                >
                  {{ field }}
                </VaChip>
              </div>
              <div class="flex justify-end">
                <VaButton
                  preset="primary"
                  icon="va-delete"
                  color="danger"
                  size="small"
                  @click="removePermission(index)"
                  class="ml-2 self-start"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <VaButton color="danger" type="reset" @click="onCancel">Cancelar</VaButton>
          <VaButton
            color="primary"
            type="submit"
            :disabled="!canSave || loading"
            :loading="loading"
          >
            Guardar
          </VaButton>
        </div>
      </form>
    </va-card-content>
  </va-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { VaButton, VaChip } from 'vuestic-ui'

const props = defineProps({
  isEdit: Boolean,
  roleName: String,
  roleDescription: String,
  permissions: {
    type: Array,
    default: () => [],
  },
  newPermission: Object,
  subjectOptions: Array,
  actionsOptions: Array,
  getFieldsOptions: Function,
  loading: Boolean,
  canSave: Boolean,
})
const emit = defineEmits([
  'update:roleName',
  'update:roleDescription',
  'add-permission',
  'remove-permission',
  'update:newPermission',
  'update:permissions',
  'submit',
  'cancel'
])

const roleName = computed({
  get: () => props.roleName,
  set: v => emit('update:roleName', v)
})
const roleDescription = computed({
  get: () => props.roleDescription,
  set: v => emit('update:roleDescription', v)
})
const newPermission = computed({
  get: () => props.newPermission,
  set: v => emit('update:newPermission', v)
})
const permissions = computed({
  get: () => props.permissions,
  set: v => emit('update:permissions', v)
})

// Sincroniza cambios internos de permisos con el padre
watch(
  () => props.permissions,
  (val) => {
    emit('update:permissions', val)
  }
)

function addPermission() {
  emit('add-permission')
  emit('update:permissions', props.permissions)
}
function removePermission(index: number) {
  emit('remove-permission', index)
  emit('update:permissions', props.permissions)
}
function onSubmit() {
  emit('submit')
}
function onCancel() {
  emit('cancel')
}

</script>
