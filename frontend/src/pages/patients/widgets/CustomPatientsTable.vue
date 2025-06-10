<script setup lang="ts">
import { defineVaDataTableColumns, useModal } from 'vuestic-ui'
import { Patient } from '../patient.types'

import { PropType, computed, toRef } from 'vue'
import { Pagination, Sorting } from '../../../data/pages/patients'
import { useVModel } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()


const columns = defineVaDataTableColumns([
  { label: t('patients.name'), key: 'name', sortable: true },
  { label: t('patients.lastName'), key: 'lastName', sortable: true },
  { label: t('patients.secondName'), key: 'secondName', sortable: true },
  { label: t('patients.secondLastName'), key: 'secondLastName', sortable: true },
  { label: t('patients.ci'), key: 'ci', sortable: true },
  { label: t('patients.birthDate'), key: 'birthDate', sortable: true },
  { label: t('patients.address'), key: 'dir', sortable: true },
  { label: t('patients.phoneNums'), key: 'phoneNums' },
  /* { label: t('patients.active'), key: 'active' }, */
  { label: t('patients.actions'), key: 'actions', align: 'right' },
])

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
        {{ rowData.secondName }}
      </div>
    </template>

    <template #cell(secondLastName)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.secondLastName }}
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
          @click="$emit('edit-patient', rowData as Patient)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="mso-delete"
          color="danger"
          aria-label="Delete patient"
          @click="onPatientDelete(rowData as Patient)"
        />
      </div>
    </template>
  </VaDataTable>

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
