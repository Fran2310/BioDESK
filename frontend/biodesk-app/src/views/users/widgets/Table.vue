<template>
  <VaDataTable
    :columns="columns"
    :items="mappedUsers"
    :per-page="pagination.perPage"
    v-model:page="pagination.page"
    :loading="usersLoading"
    :total-items="pagination.total"
  >
    <template #cell(name)="{ rowData }">
      <div class="flex items-center gap-2 max-w-[230px] ellipsis capitalize">
        {{ rowData.name }}
      </div>
    </template>

    <template #cell(lastName)="{ rowData }">
      <div class="max-w-[120px] ellipsis capitalize">
        {{ rowData.lastName }}
      </div>
    </template>

    <template #cell(ci)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ formatCi(rowData.ci) }}
      </div>
    </template>

    <template #cell(roleId)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ rowData.role }}
      </div>
    </template>

    <template #cell(email)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.email }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div v-if="rowData.role !== 'admin'" class="flex gap-2 justify-center">
        <VaButton
          preset="primary"
          size="medium"
          icon="va-close"
          color="danger"
          aria-label="Delete patient"
          @click="onUserDelete(rowData)"
        />
      </div>
    </template>
  </VaDataTable>

  <!-- Loading overlay -->
  <div
    v-if="usersLoading"
    class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10"
  >
    <VaProgressCircle indeterminate size="large" color="primary" />
  </div>

  <div
    class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2"
  >
    <div>
      <b>{{ pagination.total }} Resultados.</b>
      Resultados por página
      <VaSelect
        v-model="pagination.perPage"
        class="!w-20"
        :options="[10, 20, 50, 100]"
        @update:model-value="handlePerPageChange"
      />
    </div>

    <div v-if="shouldShowPagination" class="flex">
      <VaButton
        preset="secondary"
        icon="va-arrow-left"
        aria-label="Previous page"
        :disabled="pagination.page === 1"
        @click="pagination.page--"
      />
      <VaButton
        class="mr-2"
        preset="secondary"
        icon="va-arrow-right"
        aria-label="Next page"
        :disabled="pagination.page === totalPages"
        @click="pagination.page++"
      />
      <VaPagination
        v-model="pagination.page"
        buttons-preset="secondary"
        :pages="totalPages"
        :visible-pages="5"
        :boundary-links="false"
        :direction-links="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { userApi } from '@/services/api';
  import { formatCi } from '@/services/utils';
  import { useModal, useToast } from 'vuestic-ui';

  const { init: notify } = useToast();

  const emit = defineEmits(['delete-user'])

  const users = ref<any[]>([]);
  const usersLoading = ref(true);

  const pagination = ref({
    page: 1,
    perPage: 10,
    total: 0,
  });

  const totalPages = computed(() => {
    return Math.max(
      1,
      Math.ceil(pagination.value.total / pagination.value.perPage)
    );
  });

  const shouldShowPagination = computed(() => {
    return pagination.value.total > pagination.value.perPage;
  });

  const refreshUsers = async () => {
    await fetchUsers();
  };

  async function fetchUsers() {
    usersLoading.value = true;
    try {
      const queries = {
        offset: (pagination.value.page - 1) * pagination.value.perPage,
        limit: pagination.value.perPage,
        includePermissions: true,
      };
      const response = await userApi.getUsersMix(queries);
      users.value = Array.isArray(response.data.data) ? response.data.data : [];
      pagination.value.total = response.data.total || 0;

      // Resetear a página 1 si el cambio de perPage nos dejó en una página inválida
      if (pagination.value.page > totalPages.value) {
        pagination.value.page = 1;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      usersLoading.value = false;
    }
  }

  const handlePerPageChange = (newPerPage: number) => {
    pagination.value.perPage = newPerPage;
    // No necesitamos llamar fetchUsers aquí porque el watcher lo hará
  };

  watch(
    () => [pagination.value.page, pagination.value.perPage],
    () => {
      fetchUsers();
    },
    { immediate: true }
  );

  onMounted(() => {
    fetchUsers();
  });

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'lastName', label: 'Apellido' },
    { key: 'ci', label: 'CI' },
    { key: 'role', label: 'Rol' },
    { key: 'email', label: 'Correo' },
    { key: 'actions', label: 'Acciones' },
  ];

  const mappedUsers = computed(() =>
    users.value.map((u) => ({
      id: u.systemUser.id,
      name: u.systemUser.name,
      lastName: u.systemUser.lastName,
      ci: u.systemUser.ci,
      email: u.systemUser.email,
      role: u.labUser.role.role,
      systemUser: u.systemUser,
      labUser: u.labUser,
    }))
  );

  const { confirm } = useModal();

  const onUserDelete = async (user: any) => {
    const agreed = await confirm({
      title: 'Remover usuario',
      message: `¿Seguro que deseas remover a ${user.name} ${user.lastName} del laboratorio?`,
      okText: 'Remover',
      cancelText: 'Cancelar',
      size: 'small',
      maxWidth: '380px',
    });

    if (agreed) {
      usersLoading.value = true;
      emit('delete-user', user)
      try {
        await userApi.deleteSoftUser(user.systemUser.uuid);
      } catch (error) {}
      notify({
        message: 'Usuario removido exitosamente', // TODO Refactorizar eso
        color: 'success',
      });
      refreshUsers();
    }
  };

  // Al final del <script setup>
  function refresh() {
    fetchUsers(); // o tu función que recarga la tabla
  }

  defineExpose({ refresh });
</script>

<style scoped>
  .va-data-table ::v-deep table {
    table-layout: fixed;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
