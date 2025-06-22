<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePatientsStore } from '../../stores/patientsStore'
import { useToast, useModal } from 'vuestic-ui'
import { useI18n } from 'vue-i18n'
import PatientsForm from './widgets/PatientsForm.vue'
import CustomPatientsTable from './widgets/CustomPatientsTable.vue'
import { Patient } from './patients.types'
import { useLabStore } from '../../stores/labStore'




const { t } = useI18n()
const patientsStore = usePatientsStore()
console.log('PatientsPage: patientsStore instance', patientsStore)
const labStore = useLabStore()
const isLoading = ref(false)
const error = ref<any>(null)
const filters = ref({ isActive: true, search: '' })
const sorting = ref({ sortBy: 'fullname', sortingOrder: null })
const pagination = ref({ page: 1, perPage: 20, total: 0 })

const fetchPatients = async () => {
  console.log('PatientsPage: fetchPatients called', { filters: filters.value, sorting: sorting.value, pagination: pagination.value })
  isLoading.value = true
  error.value = null
  try {
    if (!labStore.currentLab?.id) {
      error.value = new Error('No lab selected. Please select a lab to view patients.')
      isLoading.value = false
      return
    }
    const response = await patientsStore.getAll({
      filters: filters.value,
      sorting: sorting.value,
      pagination: pagination.value,
    })
    pagination.value = response.pagination
    console.log('PatientsPage: fetchPatients success', response)
  } catch (e) {
    error.value = e
    console.error('PatientsPage: fetchPatients error', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPatients()
})

watch(
  filters,
  () => {
    pagination.value.page = 1
    fetchPatients()
  },
  { deep: true },
)

const patients = computed(() => patientsStore.items)


const doShowEditPatientModal = ref(false)
const patientToEdit = ref<Patient | null>(null)

const showEditPatientModal = (patient: Patient) => {
  console.log('PatientsPage: showEditPatientModal', patient)
  patientToEdit.value = patient
  doShowEditPatientModal.value = true
}

const showAddPatientModal = () => {
  console.log('PatientsPage: showAddPatientModal')
  patientToEdit.value = null
  doShowEditPatientModal.value = true
}

const { init: notify } = useToast()

watch(error, (val) => {
  if (val) {
    notify({
      message: val.message,
      color: 'danger',
    })
  }
})

const onPatientSaved = async (patient: Patient) => {
  console.log('PatientsPage: onPatientSaved', patient)
  isLoading.value = true
  try {
    if (patientToEdit.value) {
      await patientsStore.update(patient)
      notify({ message: `${patient.name} has been updated`, color: 'success' })
    } else {
      await patientsStore.add(patient)
      notify({ message: `${patient.name} has been created`, color: 'success' })
    }
    await fetchPatients()
  } catch (e) {
    error.value = e
    console.error('PatientsPage: onPatientSaved error', e)
  } finally {
    isLoading.value = false
  }
}

const onPatientDelete = async (patient: Patient) => {
  console.log('PatientsPage: onPatientDelete', patient)
  isLoading.value = true
  try {
    await patientsStore.remove(patient)
    notify({ message: `${patient.name} has been deleted`, color: 'success' })
    await fetchPatients()
  } catch (e) {
    error.value = e
    console.error('PatientsPage: onPatientDelete error', e)
  } finally {
    isLoading.value = false
  }
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
            <!-- <VaButtonToggle
              v-model="filters.isActive"
              color="background-element"
              border-color="background-element"
              :options="[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ]"
            /> -->
            <VaInput v-model="filters.search" placeholder="Search">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
          </div>
          <VaButton @click="showAddPatientModal">{{t('form.addPatient')}}</VaButton>
        </div>

        <!-- <h1>Hola</h1> <pre>{{ patients }}</pre> <div>Pagination: {{ pagination }}</div>
<div>Patients passed: {{ patients.length }}</div> -->
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
