<script setup lang="ts">
import { type PropType, computed, ref, onMounted } from 'vue'
import { useForm } from 'vuestic-ui'
import { validator } from '../../../services/utils'
import type { CreateUserWithRoleIdData } from '@/services/interfaces/user'
import { userApi } from '@/services/api'
import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab'
import { roleApi } from '@/services/api'
import type { GetExtendQuerys } from '@/services/interfaces/global';

const props = defineProps({
  user: {
    type: Object as PropType<CreateUserWithRoleIdData | null>,
    default: null,
  },
  saveButtonLabel: {
    type: String,
    default: 'Save',
  },
})

const defaultNewUser: CreateUserWithRoleIdData = {
  name: '',
  lastName: '',
  roleId: undefined,
  email: '',
  ci: '',
  password: ''
}

const newUser = ref<CreateUserWithRoleIdData>({ ...defaultNewUser } as CreateUserWithRoleIdData)
const roles = ref<{ id: number, role: string, description: string; permissions:object }[]>([])
const rolesLoading = ref(true)

const isFormHasUnsavedChanges = computed(() => {
  return Object.keys(newUser.value).some((key) => {
    return (
      newUser.value[key as keyof Omit<CreateUserWithRoleIdData, 'id'>] !== (props.user ?? defaultNewUser)?.[key as keyof Omit<CreateUserWithRoleIdData, 'id'>]
    )
  })
})

defineExpose({
  isFormHasUnsavedChanges,
})

const labData: LabData = {
    id: 29,
    name: "Laboratorium",
    status: "active",
    rif: "j853946049",
    logoPath: '',
};
const lab = useLabStore();
lab.setCurrentLab(labData);

const form = useForm('add-user-form')

const emit = defineEmits(['close', 'save'])

const onSave = () => {
  if (form.validate()) {
    emit('save', newUser.value)

    userApi.createUserWithRoleId(newUser.value)
  }
}

async function fetchRoles() {
  const queries: GetExtendQuerys = {
  offset: 0,
  limit: 10,
  includeData: true
  };
  const response = await roleApi.getRoles(queries)
  roles.value = Array.isArray(response.data.data) ? response.data.data : []
  rolesLoading.value = false
  
  if (!newUser.value.roleId && roles.value.length > 0) {
    newUser.value.roleId = roles.value[0].id
  }
  console.log(roles.value)
}
onMounted(() => {
  fetchRoles();
});
</script>

<template>
  <VaForm v-slot="{ isValid }" ref="add-user-form" class="flex-col justify-start items-start gap-4 inline-flex w-full">
    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="newUser.name"
          label="Nombre"
          class="w-full sm:w-1/2"
          :rules="[validator.required]"
          name="name"
        />
        <VaInput
          v-model="newUser.lastName"
          label="Apellido"
          class="w-full sm:w-1/2"
          :rules="[validator.required]"
          name="lastName"
        />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="newUser.ci"
          label="Cédula"
          class="w-full sm:w-1/2"
          :rules="[validator.required]"
          name="ci"
        />
        <VaSelect
          v-model="newUser.roleId"
          label="Rol"
          class="w-full sm:w-1/2"
          name="roleId"
          :options="roles"
          :rules="[validator.required]"
          :loading="rolesLoading"
          :disabled="rolesLoading"
          text-by="role"
          value-by="id"
        />
      </div>
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="newUser.email"
          label="Email"
          class="w-full sm:w-1/2"
          :rules="[validator.required, validator.email]"
          name="email"
        />
        <VaInput
          v-model="newUser.password"
          label="Contraseña"
          class="w-full sm:w-1/2"
          :rules="[validator.required, validator.hasUppercase, validator.hasNumber, validator.minLength]"
          name="password"
        />  
      </div>

      <div class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center">
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">Cancelar</VaButton>
        <VaButton :disabled="!isValid" @click="onSave">{{ saveButtonLabel }}</VaButton>
      </div>
    </div>
  </VaForm>
</template>
