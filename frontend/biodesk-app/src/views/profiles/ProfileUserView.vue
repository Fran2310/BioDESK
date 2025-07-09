<template>
  <div class="p-6">
    <VaCard class="mb-4 shadow-2xl min-w-full" v-if="userData">
      <VaCardTitle class="flex justify-between items-center">
        <div class="text-2xl font-bold">
          {{ fullName }}
        </div>
        <VaChip
          :color="userData.systemUser.isActive ? 'success' : 'danger'"
          size="small"
        >
          {{ userData.systemUser.isActive ? 'Activo' : 'Inactivo' }}
        </VaChip>
      </VaCardTitle>

      <VaCardContent class="space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="badge" color="primary" />
          <span class="text-sm text-gray-600">CI:</span>
          <span class="font-medium">{{
            formatCi(userData.systemUser.ci)
          }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="mail" color="primary" />
          <span class="text-sm text-gray-600">Correo:</span>
          <span class="font-medium">{{ userData.systemUser.email }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="verified_user" color="primary" />
          <span class="text-sm text-gray-600">Rol:</span>
          <VaChip color="info" class="capitalize">
            {{ userData.labUser.role.role }}
          </VaChip>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="schedule" color="primary" />
          <span class="text-sm text-gray-600">Último acceso:</span>
          <span class="font-medium">{{ lastAccessDisplay }}</span>
        </div>
      </VaCardContent>

      <VaCardActions align="right">
        <VaButton icon="edit" color="primary" @click="onEditProfile">
          Editar perfil
        </VaButton>
        <VaButton icon="lock" color="warning" @click="onChangePassword">
          Cambiar contraseña
        </VaButton>
      </VaCardActions>
    </VaCard>

    <!-- Placeholder si no hay datos aún -->
    <div
      v-else-if="loading"
      class="text-center text-gray-500 mt-6 flex justify-center items-center"
    >
      <VaProgressCircle indeterminate size="large" color="primary" />
    </div>

    <div v-else class="text-center text-red-500 mt-6">
      No se pudo cargar la información del perfil.
    </div>

    <!-- Modal para editar perfil -->
    <VaModal
      v-model="isEditModalOpen"
      title="Editar perfil"
      ok-text="Guardar cambios"
      cancel-text="Cancelar"
      size="small"
      @ok="submitEdit"
      close-button
      blur
    >
      <VaForm
        ref="editFormRef"
        class="space-y-3 flex flex-col justify-center items-center"
      >
        <VaInput
          v-model="editableForm.name"
          label="Nombre"
          required-mark
          :rules="[(v) => !!v || 'Requerido']"
          class="w-full"
        />
        <VaInput
          v-model="editableForm.lastName"
          label="Apellido"
          required-mark
          :rules="[(v) => !!v || 'Requerido']"
          class="w-full"
        />
        <VaInput
          v-model="editableForm.email"
          label="Correo"
          required-mark
          :rules="[
            (v) => !!v || 'Requerido',
            (v) => /^\S+@\S+\.\S+$/.test(v) || 'Correo inválido',
          ]"
          class="w-full"
        />
      </VaForm>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue';
  import dayjs from 'dayjs';
  import 'dayjs/locale/es';
  import router from '@/router';
  import { userApi } from '@/services/api';
  import type { GetWithPermissionsQuerys } from '@/services/interfaces/global';
  import { UpdateSystemUserData } from '@/services/interfaces/user';
  import { initToast } from '@/services/toast';
  import { formatCi } from '@/services/utils';

  dayjs.locale('es');

  const userData = ref<any>(null);
  const loading = ref(true);

  // Computed: nombre completo
  const fullName = computed(() => {
    if (!userData.value) return '';
    return `${userData.value.systemUser.name} ${userData.value.systemUser.lastName}`;
  });

  // Computed: último acceso formateado
  const lastAccessDisplay = computed(() => {
    const lastAccess = userData.value?.systemUser?.lastAccess;
    return lastAccess ? dayjs(lastAccess).format('DD MMM YYYY HH:mm') : 'Nunca';
  });

  // Modal control
  const isEditModalOpen = ref(false);
  const editFormRef = ref();

  // Formulario editable
  const editableForm = reactive<UpdateSystemUserData>({
    name: '',
    lastName: '',
    email: '',
  });

  // Abre la modal con los datos actuales
  async function onEditProfile() {
    if (!userData.value) return;
    editableForm.name = userData.value.systemUser.name;
    editableForm.lastName = userData.value.systemUser.lastName;
    editableForm.email = userData.value.systemUser.email;
    isEditModalOpen.value = true;
  }

  // Enviar cambios al backend
  async function submitEdit() {
    const isValid = await editFormRef.value?.validate?.();
    if (!isValid) return;

    try {
      // Actualizar localmente los datos después del éxito
      userData.value.systemUser.name = editableForm.name;
      userData.value.systemUser.lastName = editableForm.lastName;
      userData.value.systemUser.email = editableForm.email;
      const response = await userApi.updateSystemUser(
        userData.value.systemUser.uuid,
        { ...editableForm }
      );
      initToast('Datos de usuario', response.data.message, 'info');

      // Cerrar modal
      isEditModalOpen.value = false;
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
    }
  }

  function onChangePassword() {
    router.push({ name: 'ForgotPassword' });
  }

  // Obtener datos reales del usuario logueado
  onMounted(async () => {
    try {
      const { data } = await userApi.getMe();
      const query: GetWithPermissionsQuerys = {
        'search-fields': ['email'],
        'search-term': data.email,
        offset: 0,
        limit: 100,
        includePermissions: false,
      };
      const response = await userApi.getUsersMix(query);
      userData.value = response.data.data[0] || null;
      console.log(userData.value);

      userData.value.systemUser.lastAccess = Date.now() - 2 * 60 * 60 * 1000;
    } catch (error) {
      console.error('Error al cargar datos de perfil', error);
    } finally {
      loading.value = false;
    }
  });
</script>

<style scoped>
  .va-card {
    max-width: 600px;
    margin: auto;
  }
</style>
