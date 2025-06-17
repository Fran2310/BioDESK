<script setup lang="ts">
import { defineVaDataTableColumns, useModal } from 'vuestic-ui'
import { Patient } from '../patient.types'

import { PropType, computed, toRef, ref} from 'vue'
import { Pagination, Sorting } from '../../../data/pages/patients'
import { useVModel } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

//AGE CALCULATION

const calculateAge = (birthDate: string): number => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

//SELECTED PATIENT

const selectedPatient = ref<Patient | null>(null)
const isDetailsModalOpen = ref(false)

//THIS IS THE EVENT HANDLER, IT WAS EVENT.ITEM, NOT ROWDATA

const handleRowClick = (event: { item: Patient }) => {
  selectedPatient.value = event.item
  isDetailsModalOpen.value = true
}





//COLUMNS DEFINITION

const columns = defineVaDataTableColumns([
  { label: t('patients.name'), key: 'name', sortable: true },
  { label: t('patients.lastName'), key: 'lastName', sortable: true },
  { label: t('patients.secondName'), key: 'secondName', sortable: true },
  { label: t('patients.secondLastName'), key: 'secondLastName', sortable: true },
  { label: t('patients.ci'), key: 'ci', sortable: true },
  { label: t('patients.birthDate'), key: 'birthDate', sortable: true },
  { label: t('patients.address'), key: 'dir', sortable: true },
  /* { label: t('patients.phoneNums'), key: 'phoneNums' } */
  /* { label: t('patients.active'), key: 'active' }, */
  { label: t('patients.actions'), key: 'actions', align: 'right' },
])


//PROPS PASSED BY PARENT

const props = defineProps({
  patients: {
    type: Array as PropType<Patient[]>,
    required: true,
  },
  
  loading: { type: Boolean, default: false },
  pagination: { type: Object as PropType<Pagination>, required: true },
  sortBy: { type: String as PropType<Sorting['sortBy']>, required: true },
  sortingOrder: { type: String as PropType<Sorting['sortingOrder']>, default: null },
})


//EMITS

const emit = defineEmits<{
  (event: 'edit-patient', patient: Patient): void
  (event: 'delete-patient', patient: Patient): void
  (event: 'update:sortBy', sortBy: Sorting['sortBy']): void
  (event: 'update:sortingOrder', sortingOrder: Sorting['sortingOrder']): void
}>()

const patients = toRef(props, 'patients')
const sortByVModel = useVModel(props, 'sortBy', emit)
const sortingOrderVModel = useVModel(props, 'sortingOrder', emit)


const totalPages = computed(() => Math.ceil(props.pagination.total / props.pagination.perPage))

const { confirm } = useModal()

const onPatientDelete = async (patient: Patient) => {
  const agreed = await confirm({
    title: 'Delete user',
    message: `Are you sure you want to delete ${patient.name} ${patient.lastName}?`,
    okText: 'Delete',
    cancelText: 'Cancel',
    size: 'small',
    maxWidth: '380px',
  })

  if (agreed) {
    emit('delete-patient', patient)
  }
}

//HELPER FUNCTION FOR PHONE NUMBERS

const displayPhones = (phones: string[]) => {
  return phones.filter(Boolean).join(', ')
}

//HELPER FUNCTION FOR DATES

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}


</script>

<template>
  <VaDataTable
    v-model:sort-by="sortByVModel"
    v-model:sorting-order="sortingOrderVModel"
    :columns="columns"
    :items="patients"
    :loading="$props.loading"
    :clickable="false"
    @row:click="handleRowClick"
  >
    <template #cell(name)="{ rowData }">
      <div class="flex items-center gap-2 max-w-[230px] ellipsis">
        <!-- <UserAvatar :user="rowData as Patient" size="small" /> -->
        {{ rowData.name }}
      </div>
    </template>

    <template #cell(lastName)="{ rowData }">
      <div class="max-w-[120px] ellipsis">
        {{ rowData.lastName }}
      </div>
    </template>

    <template #cell(secondName)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ (rowData.secondName)? rowData.secondName : 'N/A' }}
      </div>
    </template>

    <template #cell(secondLastName)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ (rowData.secondLastName)? rowData.secondLastName : 'N/A' }}
      </div>
    </template>

    <template #cell(ci)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.ci }}
      </div>
    </template>

    <template #cell(birthDate)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ formatDate(rowData.birthDate) }}
      </div>
    </template>

    <template #cell(dir)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.dir }}
      </div>
    </template>

    <template #cell(phoneNums)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ displayPhones(rowData.phoneNums) }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div class="flex gap-2 justify-end">
        <VaButton
          preset="primary"
          size="small"
          icon="mso-edit"
          aria-label="Edit patient"
          @click.stop="$emit('edit-patient', rowData as Patient)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="mso-delete"
          color="danger"
          aria-label="Delete patient"
          @click.stop="onPatientDelete(rowData as Patient)"
        />
      </div>
    </template>
  </VaDataTable>



  <!-- Patient Details Modal -->
    <VaModal v-model="isDetailsModalOpen" hide-default-actions size="large">
       <h2 class="va-h3 text-primary"> Detalles del paciente </h2>
      
      <div class="p-4 space-y-4">
        <div class="grid grid-cols-2 gap-4">

          <div>
            <strong>Nombre:</strong>
            <p>{{ selectedPatient?.name || '-' }}</p>
          </div>

          <div>
            <strong>Apellido:</strong>
            <p>{{ selectedPatient?.lastName || '-' }}</p>
          </div>

          <div>
            <strong>Segundo Nombre:</strong>
            <p>{{ selectedPatient?.secondName || 'N/A' }}</p>
          </div>

          <div>
            <strong>Segundo Apellido:</strong>
            <p>{{ selectedPatient?.secondLastName || 'N/A' }}</p>
          </div>

          <div>
            <strong>CI:</strong>
            <p>{{ selectedPatient?.ci || '-' }}</p>
          </div>

          <div>
            <strong>Dirección:</strong>
            <p>{{ selectedPatient?.dir || '-' }}</p>
          </div>

          <div>
            <strong>Email:</strong>
            <p>{{ selectedPatient?.email || 'N/A' }}</p>
          </div>

          <div>
            <strong>Teléfonos:</strong>
            <p>{{ displayPhones(selectedPatient?.phoneNums || []) }}</p>
          </div>

          <div>
            <strong>Fecha de Nacimiento:</strong>
            <p>{{ formatDate(selectedPatient?.birthDate) }}</p>
          </div>

          <div>
            <strong>Edad Actual:</strong>
            <p>{{ selectedPatient?.birthDate ? calculateAge(selectedPatient.birthDate) : '-' }}</p>
          </div>

        </div>
      
      
      </div>

      <template #footer>
      
        <VaButton @click="isDetailsModalOpen = false">Cerrar</VaButton>
        
      </template>
        
          
        
    
    </VaModal>



  <div class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2">
    <div>
      <b>{{ $props.pagination.total }} results.</b>
      Results per page
      <VaSelect v-model="$props.pagination.perPage" class="!w-20" :options="[10, 50, 100]" />
    </div>

    <div v-if="totalPages > 1" class="flex">
      <VaButton
        preset="secondary"
        icon="va-arrow-left"
        aria-label="Previous page"
        :disabled="$props.pagination.page === 1"
        @click="$props.pagination.page--"
      />
      <VaButton
        class="mr-2"
        preset="secondary"
        icon="va-arrow-right"
        aria-label="Next page"
        :disabled="$props.pagination.page === totalPages"
        @click="$props.pagination.page++"
      />
      <VaPagination
        v-model="$props.pagination.page"
        buttons-preset="secondary"
        :pages="totalPages"
        :visible-pages="5"
        :boundary-links="false"
        :direction-links="false"
      />
    </div>
  </div>


</template>

<style lang="scss" scoped>
.va-data-table {
  ::v-deep(.va-data-table__table-tr) {
    border-bottom: 1px solid var(--va-background-border);
  }
}
</style>
