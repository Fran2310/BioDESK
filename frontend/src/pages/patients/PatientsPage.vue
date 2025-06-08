<script setup lang="ts">
import { ref } from 'vue'
import { usePatients } from './composables/usePatients'

import { useToast, useModal } from 'vuestic-ui'
import { useI18n } from 'vue-i18n'
import PatientsForm from './widgets/PatientsForm.vue'

import CustomPatientsTable from './widgets/CustomPatientsTable.vue'
import { Patient } from './patients.types'

//DEBUG MOCK ARRAY OF PATIENTS HERE

/* const mockPatients = ref<User[]>([
  {
    id: '1',
    ci: '12345678',
    name: 'John',
    lastName: 'Doe',
    secondName: '',
    secondLastName: '',
    email: 'john@example.com',
    phoneNums: ['+123456789'],
    dir: 'Main St.',
    birthDate: '1990-01-01',
    active: true,
    avatar: '',
    notes: '',
    role: 'user',
  },
  {
    id: '2',
    ci: '87654321',
    name: 'Jane',
    lastName: 'Smith',
    secondName: 'Marie',
    secondLastName: 'Johnson',
    email: 'jane.smith@example.com',
    phoneNums: ['+987654321', '+555555555'],
    dir: 'Elm Street',
    birthDate: '1985-05-10',
    active: false,
    avatar: '',
    notes: 'Allergic to penicillin',
    role: 'admin',
  },
]) */

//HANDLERS, NOT USED ANYMORE

/* function handleEdit(patient: Patient) {
  alert(`Editing patient: ${patient.name} ${patient.lastName}`)
}

function handleDelete(patient: Patient) {
  alert(`Deleting patient: ${patient.name} ${patient.lastName}`)
}
 */
/* console.log("Mock Patients: ", mockPatients.value) */



const { t } = useI18n()
const { patients, isLoading, filters, sorting, pagination, error, ...usersApi } = usePatients()
/* const { projects } = useProjects() */

const doShowEditPatientModal = ref(false)
const patientToEdit = ref<Patient | null>(null)

const showEditPatientModal = (patient: Patient) => {
  patientToEdit.value = patient
  doShowEditPatientModal.value = true
}

const showAddPatientModal = () => {
  patientToEdit.value = null
  doShowEditPatientModal.value = true
}

const { init: notify } = useToast()

if (error.value) {
  notify({
    message: error.value.message,
    color: 'danger',
  })
}

const onPatientSaved = async (patient: Patient) => {

//AVATAR, USELESS FOR NOW

  /*  if (user.avatar.startsWith('blob:')) {
    const blob = await fetch(user.avatar).then((r) => r.blob())
    const { publicUrl } = await usersApi.uploadAvatar(blob)
    user.avatar = publicUrl
  } */

  if (patientToEdit.value) {
    await usersApi.update(patient)
    notify({ message: `${patient.name} has been updated`, color: 'success' })
  } else {
    await usersApi.add(patient)
    notify({ message: `${patient.name} has been created`, color: 'success' })
  }
}

const onPatientDelete = async (patient: Patient) => {
  await usersApi.remove(patient)
  notify({ message: `${patient.name} has been deleted`, color: 'success' })
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
          <VaButton @click="showAddPatientModal">Add Patient</VaButton>
        </div>

        <h1>Hola</h1> <pre>{{ patients }}</pre> <div>Pagination: {{ pagination }}</div>
<div>Patients passed: {{ patients.length }}</div>
        <CustomPatientsTable
        v-model:sort-by="sorting.sortBy"
        v-model:sorting-order="sorting.sortingOrder"
        :patients="patients"
        :loading="isLoading"
        :pagination="pagination"
        @edit-patient="showEditPatientModal"
        @delete-patient="onPatientDelete"
        />

      </VaCardContent>
    </VaCard>

    <VaModal
      v-model="doShowEditPatientModal"
      size="small"
      mobile-fullscreen
      close-button
      hide-default-actions
      :before-cancel="beforeEditFormModalClose"
      v-slot="{ cancel, ok }"
    >
      <h1 class="va-h5">{{ patientToEdit ? t('form.editPatient') : t('form.addPatient') }}</h1>
      <PatientsForm
        ref="editFormRef"
        :patient="patientToEdit"
        :save-button-label="patientToEdit ? t('form.save') : t('form.add')"
        @close="cancel"
        @save="(patient) => { onPatientSaved(patient); ok() }"
      />
    </VaModal>
  </div>
</template>
