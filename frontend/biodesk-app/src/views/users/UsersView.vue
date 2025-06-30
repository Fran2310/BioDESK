<script setup lang="ts">
  import { ref, watchEffect } from 'vue';
  import UsersTable from './widgets/UsersTable.vue';
  import EditUserForm from './widgets/EditUserForm.vue';
  import AddExisting from './widgets/AddExisting.vue';
  import { useModal, useToast } from 'vuestic-ui';
  import type { CreateUserWithRoleIdData } from '@/services/interfaces/user';

  const doShowEditUserModal = ref(false);
  const doShowAddExistingModal = ref(false);

  const userToEdit = ref<CreateUserWithRoleIdData | null>(null);

  const showEditUserModal = (user: CreateUserWithRoleIdData) => {
    userToEdit.value = user;
    doShowEditUserModal.value = true;
  };

  const showAddNewUserModal = () => {
    userToEdit.value = null;
    doShowEditUserModal.value = true;
  };

  const showAddExistingModal = (user: CreateUserWithRoleIdData) => {
    userToEdit.value = null;
    doShowEditUserModal.value = true;
  };

  const { init: notify } = useToast();

  const onUserSaved = async (user: CreateUserWithRoleIdData) => {
    if (userToEdit.value) {
      console.log('userToEdit.value: ', userToEdit.value);
    } else {
      console.log('Añadir usuario');
    }
  };

  const onUserDelete = async (user: CreateUserWithRoleIdData) => {
    console.log('Delete user');
    notify({
      message: `${user.name} ${user.lastName} ha sido eliminado`,
      color: 'success',
    });
  };

  const editFormRef = ref();

  const { confirm } = useModal();

  const beforeEditFormModalClose = async (hide: () => unknown) => {
    if (editFormRef.value.isFormHasUnsavedChanges) {
      const agreed = await confirm({
        maxWidth: '380px',
        message:
          'El formulario tiene cambios sin guardar. ¿Seguro que lo quiere cerrar?',
        size: 'small',
      });
      if (agreed) {
        hide();
      }
    } else {
      hide();
    }
  };
</script>

<template>
  <h1 class="font-bold text-5xl">Usuarios</h1>

  <VaCard>
    <VaCardContent>
      <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
        <div class="flex flex-col md:flex-row gap-2 justify-start">
          <!--<VaInput v-model="filters.search" placeholder="Buscar">
            <template #prependInner>
              <VaIcon name="search" color="secondary" size="small" />
            </template>
          </VaInput>-->
        </div>
        <VaButton @click="showAddExistingModal"
          >Añadir Usuario Existente</VaButton
        >
        <VaButton @click="showAddNewUserModal">Añadir Nuevo Usuario</VaButton>
      </div>
      <!--
      <UsersTable
        v-model:sort-by="sorting.sortBy"
        v-model:sorting-order="sorting.sortingOrder"
        :users="users"
        :loading="isLoading"
        :pagination="pagination"
        @editUser="showEditUserModal"
        @deleteUser="onUserDelete"
      />
      -->
    </VaCardContent>
  </VaCard>

  <VaModal
    v-slot="{ cancel, ok }"
    v-model="doShowEditUserModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
    :before-cancel="beforeEditFormModalClose"
  >
    <h1 class="va-h5">
      {{ userToEdit ? 'Editar usuario' : 'Añadir usuario' }}
    </h1>
    <EditUserForm
      ref="editFormRef"
      :user="userToEdit"
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="cancel"
      @save="
        (user) => {
          onUserSaved(user);
          ok();
        }
      "
    />
  </VaModal>

  <VaModal
    v-slot="{ cancel, ok }"
    v-model="doShowAddExistingModal"
    size="small"
    mobile-fullscreen
    close-button
    hide-default-actions
    :before-cancel="beforeEditFormModalClose"
  >
    <h1 class="va-h5">
      {{ userToEdit ? 'Editar usuario' : 'Añadir usuario' }}
    </h1>
    <AddExisting
      ref="editFormRef"
      :user="userToEdit"
      :save-button-label="userToEdit ? 'Guardar' : 'Añadir'"
      @close="cancel"
      @save="
        (user) => {
          onUserSaved(user);
          ok();
        }
      "
    />
  </VaModal>
</template>
