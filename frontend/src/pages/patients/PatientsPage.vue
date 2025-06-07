<script setup lang="ts">
import { ref } from 'vue'
import { useUsers } from './composables/useUsers'
import { useProjects } from '../projects/composables/useProjects'
import { useToast, useModal } from 'vuestic-ui'
import { useI18n } from 'vue-i18n'
import PatientsForm from './widgets/PatientsForm.vue'
import UsersTable from './widgets/UsersTable.vue'
import CustomPatientsTable from './widgets/CustomPatientsTable.vue'
import { User } from './types'

const { t } = useI18n()
const { users, isLoading, filters, sorting, pagination, error, ...usersApi } = useUsers()
const { projects } = useProjects()

const doShowEditUserModal = ref(false)
const userToEdit = ref<User | null>(null)

const showEditUserModal = (user: User) => {
  userToEdit.value = user
  doShowEditUserModal.value = true
}

const showAddUserModal = () => {
  userToEdit.value = null
  doShowEditUserModal.value = true
}

const { init: notify } = useToast()

if (error.value) {
  notify({
    message: error.value.message,
    color: 'danger',
  })
}

const onUserSaved = async (user: User) => {
  if (user.avatar.startsWith('blob:')) {
    const blob = await fetch(user.avatar).then((r) => r.blob())
    const { publicUrl } = await usersApi.uploadAvatar(blob)
    user.avatar = publicUrl
  }

  if (userToEdit.value) {
    await usersApi.update(user)
    notify({ message: `${user.name} has been updated`, color: 'success' })
  } else {
    await usersApi.add(user)
    notify({ message: `${user.name} has been created`, color: 'success' })
  }
}

const onUserDelete = async (user: User) => {
  await usersApi.remove(user)
  notify({ message: `${user.name} has been deleted`, color: 'success' })
}

const { confirm } = useModal()

const editFormRef = ref()

const beforeEditFormModalClose = async (hide: () => unknown) => {
  if (editFormRef.value?.isFormHasUnsavedChanges) {
    const agreed = await confirm({
      maxWidth: '380px',
      message: /* t('form.unsavedChangesMessage') */ 0 || 'Form has unsaved changes. Are you sure you want to close it?',
      size: 'small',
    })
    if (agreed) {
      hide()
    }
  } else {
    hide()
  }
}
</script>

<template>
  <div> <!-- Single root wrapper -->
    <h1 class="page-title">{{ t('menu.patients') }}</h1>

    <VaCard>
      <VaCardContent>
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div class="flex flex-col md:flex-row gap-2 justify-start">
            <VaButtonToggle
              v-model="filters.isActive"
              color="background-element"
              border-color="background-element"
              :options="[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ]"
            />
            <VaInput v-model="filters.search" placeholder="Search">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
          </div>
          <VaButton @click="showAddUserModal">Add Patient</VaButton>
        </div>

        <CustomPatientsTable
          v-model:sort-by="sorting.sortBy"
          v-model:sorting-order="sorting.sortingOrder"
          :users="users"
          :projects="projects"
          :loading="isLoading"
          :pagination="pagination"
          @editUser="showEditUserModal"
          @deleteUser="onUserDelete"
        />
      </VaCardContent>
    </VaCard>

    <VaModal
      v-model="doShowEditUserModal"
      size="small"
      mobile-fullscreen
      close-button
      hide-default-actions
      :before-cancel="beforeEditFormModalClose"
      v-slot="{ cancel, ok }"
    >
      <h1 class="va-h5">{{ userToEdit ? t('form.editPatient') : t('form.addPatient') }}</h1>
      <PatientsForm
        ref="editFormRef"
        :user="userToEdit"
        :save-button-label="userToEdit ? t('form.save') : t('form.add')"
        @close="cancel"
        @save="(user) => { onUserSaved(user); ok() }"
      />
    </VaModal>
  </div>
</template>
