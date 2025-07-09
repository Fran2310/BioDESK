<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue';
  import { useForm } from 'vuestic-ui';
  import { validator } from '../../../services/utils';
  import type { CreateUserWithRoleIdData } from '@/services/interfaces/user';
  import { userApi, roleApi } from '@/services/api';
  import type { GetExtendQuerys } from '@/services/interfaces/global';
  import { useToast } from 'vuestic-ui';

  const emit = defineEmits(['close', 'save']);

  const { init: notify } = useToast();

  // === Modelo principal del formulario (reactivo) ===
  const formData = reactive({
    email: '',
    password: '',
    name: '',
    lastName: '',
    ci: '',
    ciType: 'V', // V = Venezolano, E = Extranjero, etc.
    roleId: null,
  });

  // === Control de formulario y estado ===
  const form = useForm('add-user-form');
  const isSavingUser = ref(false);

  // === Roles dinámicos desde el backend ===
  const roles = ref<
    { id: number; role: string; description: string; permissions: object }[]
  >([]);
  const rolesLoading = ref(true);

  onMounted(() => {
    fetchRoles();
  });

  // === Computado para detectar cambios en el formulario ===
  const isFormHasUnsavedChanges = computed(() => {
    return Object.keys(formData).some((key) => {
      return formData[key as keyof CreateUserWithRoleIdData];
    });
  });

  // Expone al componente padre si hay cambios sin guardar
  defineExpose({
    isFormHasUnsavedChanges,
  });

  // === Carga de roles desde la API ===
  async function fetchRoles() {
    const queries: GetExtendQuerys = {
      offset: 0,
      limit: 10,
      includeData: true,
    };

    const response = await roleApi.getRoles(queries);
    roles.value = Array.isArray(response.data.data) ? response.data.data : [];
    rolesLoading.value = false;

    // Si no hay roleId asignado, asignar el primero
    if (!formData.roleId && roles.value.length > 0) {
      formData.roleId = roles.value[0].id;
    }
  }

  // === Guardado del usuario usando la API ===
  const onSave = async () => {
    if (form.validate()) {
      // Formatear los datos para el backend
      const data = {
        ci: `${formData.ciType}${formData.ci}`,
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
      };
      isSavingUser.value = true;
      try {
        await userApi.createUserWithRoleId({ ...data }); // se pasa como objeto plano
        emit('save', { ...data });
        notify({ message: 'Usuario creado con éxito', color: 'success' });
      } catch (error: any) {
        notify({ message: error.message, color: 'danger' });
      } finally {
        isSavingUser.value = false;
      }
    }
  };
</script>

<template>
  <VaForm
    v-slot="{ isValid }"
    ref="add-user-form"
    class="flex-col justify-start items-start gap-4 inline-flex w-full"
  >
    <div class="self-stretch flex-col justify-start items-start gap-4 flex">
      <div class="gap-2 flex w-full flex-wrap items-start valuesCenter">
        <VaSelect
          label="Cédula"
          required-mark
          v-model="formData.ciType"
          class="w-full lg:w-20"
          :options="['V', 'E']"
          color="primary"
        />
        <VaInput
          v-model="formData.ci"
          label="N°"
          :rules="[
            validator.required,
            validator.onlyNumbers,
            validator.minLengthCi,
          ]"
          placeholder="12345678"
          type="text"
          color="primary"
          class="flex-1"
        >
          <template #prependInner>
            <VaIcon name="assignment_ind" color="secondary" />
          </template>
        </VaInput>
      </div>

      <!-- Nombre y Apellido -->
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="formData.name"
          required-mark
          label="Nombre"
          class="w-full sm:w-1/2"
          :rules="[validator.required]"
          name="name"
        />
        <VaInput
          v-model="formData.lastName"
          required-mark
          label="Apellido"
          class="w-full sm:w-1/2"
          :rules="[validator.required]"
          name="lastName"
        />
      </div>

      <!-- Email y Contraseña -->
      <div class="flex gap-4 flex-col sm:flex-row w-full">
        <VaInput
          v-model="formData.email"
          autocomplete="email"
          :rules="[validator.required, validator.email]"
          class="w-full"
          label="Email"
          type="email"
          color="primary"
          required-mark
        >
          <template #prependInner>
            <VaIcon name="mail_outline" color="secondary" />
          </template>
        </VaInput>
        <!-- Contraseña -->
        <VaValue v-slot="isPasswordVisible" :default-value="false">
          <VaInput
            v-model="formData.password"
            :rules="[
              validator.required,
              validator.hasUppercase,
              validator.hasNumber,
              validator.minLength,
            ]"
            required-mark
            :type="isPasswordVisible.value ? 'text' : 'password'"
            color="primary"
            label="Contraseña"
            @clickAppendInner.stop="
              isPasswordVisible.value = !isPasswordVisible.value
            "
          >
            <template #prependInner>
              <VaIcon name="key" color="secondary" />
            </template>
            <template #appendInner>
              <VaIcon
                :name="
                  isPasswordVisible.value ? 'visibility_off' : 'visibility'
                "
                class="cursor-pointer"
                color="secondary"
              />
            </template>
          </VaInput>
        </VaValue>
      </div>

      <!-- Selector de rol -->
      <VaSelect
        v-model="formData.roleId"
        required-mark
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

      <!-- Botones de acción -->
      <div
        class="flex gap-2 flex-col-reverse items-stretch justify-end w-full sm:flex-row sm:items-center"
      >
        <VaButton preset="secondary" color="secondary" @click="$emit('close')">
          Cancelar
        </VaButton>

        <VaButton
          :disabled="!isValid || isSavingUser"
          :loading="isSavingUser"
          @click="onSave"
        >
          Guardar
        </VaButton>
      </div>
    </div>
  </VaForm>
</template>

<style scoped>
  .valuesCenter ::v-deep(.va-select-content) {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.75rem;
  }
</style>
