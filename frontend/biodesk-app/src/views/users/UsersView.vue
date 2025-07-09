<script setup lang="ts">
  import { ref } from 'vue';
  import AddNewUser from './widgets/AddNewUser.vue';
  import AddExisting from './widgets/AddExisting.vue';
  import type { CreateUserWithRoleIdData } from '@/services/interfaces/user';

  import Table from './widgets/Table.vue';

  const doShowEditUserModal = ref(false);
  const doShowAddExistingModal = ref(false);

  const userToEdit = ref<CreateUserWithRoleIdData | null>(null);

  const showAddNewUserModal = () => {
    userToEdit.value = null;
    doShowEditUserModal.value = true;
  };

  const showAddExistingModal = (user: CreateUserWithRoleIdData) => {
    userToEdit.value = null;
    doShowAddExistingModal.value = true;
  };

  const usersTableRef = ref(Table);

  function onAddExistingModal() {
    doShowAddExistingModal.value = false;
    usersTableRef.value?.refreshUsers();
  }

  const editFormRef = ref();

</script>

<template>
  <VaCard>
    <VaCardContent>
      <div
        class="flex flex-col md:flex-row gap-2 mb-2 justify-between items-end"
      >
        <div class="flex flex-col md:flex-row gap-2 justify-start">
          <!--<VaInput v-model="filters.search" placeholder="Buscar">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>-->
        </div>
        <div class="flex gap-2">
          <VaButton @click="showAddExistingModal"
            >Añadir Usuario Existente</VaButton
          >
          <VaButton @click="showAddNewUserModal">Añadir Nuevo Usuario</VaButton>
        </div>
      </div>
      <Table ref="usersTableRef" />
    </VaCardContent>
  </VaCard>

  <VaModal
    v-slot="{ cancel, ok }"
    v-model="doShowEditUserModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
  >
    <h1 class="va-h5">
      {{ userToEdit ? 'Editar usuario' : 'Añadir usuario' }}
    </h1>
    <AddNewUser
      ref="editFormRef"
      :user="userToEdit"
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="cancel"
      @save="usersTableRef.value?.refresh()"
    />
  </VaModal>

  <VaModal
    v-model="doShowAddExistingModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
  >
    <h1 class="va-h5">
      {{ userToEdit ? 'Editar usuario Existente' : 'Añadir usuario Existente' }}
    </h1>
    <AddExisting
      ref="editFormRef"
      :user="userToEdit"
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="doShowAddExistingModal = false"
      @save="onAddExistingModal()"
    />
  </VaModal>
</template>
