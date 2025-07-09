<script setup lang="ts">
  import { ref } from 'vue';
  import AddNewUser from './widgets/AddNewUser.vue';
  import AddExisting from './widgets/AddExisting.vue';
  import type { CreateUserWithRoleIdData } from '@/services/interfaces/user';

  import Table from './widgets/Table.vue';

  const doShowAddUserModal = ref(false);
  const doShowAddExistingModal = ref(false);

  const userToEdit = ref<CreateUserWithRoleIdData | null>(null);

  const showAddNewUserModal = () => {
    userToEdit.value = null;
    doShowAddUserModal.value = true;
  };

  const showAddExistingModal = () => {
    userToEdit.value = null;
    doShowAddExistingModal.value = true;
  };

  const usersTableRef = ref(Table);

  function onAddUser() {
    doShowAddUserModal.value = false;
    usersTableRef.value?.refreshUsers();
  }

  function onAddExistingUser() {
    doShowAddExistingModal.value = false;
    usersTableRef.value?.refreshUsers();
  }

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
    v-model="doShowAddUserModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
  >
    <h1 class="va-h5">
      {{ userToEdit ? 'Editar usuario' : 'Añadir usuario' }}
    </h1>
    <AddNewUser
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="doShowAddUserModal = false"
      @save="onAddUser()"
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
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="doShowAddExistingModal = false"
      @save="onAddExistingUser()"
    />
  </VaModal>
</template>
