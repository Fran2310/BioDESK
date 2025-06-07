<script setup lang="ts">
import { defineVaDataTableColumns, useModal } from 'vuestic-ui'
import { User, UserRole } from '../types'
import UserAvatar from './UserAvatar.vue'
import { PropType, computed, toRef } from 'vue'
import { Pagination, Sorting } from '../../../data/pages/users'
import { useVModel } from '@vueuse/core'
import { Project } from '../../projects/types'

const columns = defineVaDataTableColumns([
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Last Name', key: 'lastName', sortable: true },
  { label: 'Second Name', key: 'secondName', sortable: true },
  { label: 'Second Last Name', key: 'secondLastName', sortable: true },
  { label: 'CI', key: 'ci', sortable: true },
  { label: 'Birth Date', key: 'birthDate', sortable: true },
  { label: 'Address', key: 'dir', sortable: true },
  { label: 'Phone Numbers', key: 'phoneNums' },
  { label: 'Active', key: 'active' },
  { label: '', key: 'actions', align: 'right' },
])

const props = defineProps({
  users: {
    type: Array as PropType<User[]>,
    required: true,
  },
  
  loading: { type: Boolean, default: false },
  pagination: { type: Object as PropType<Pagination>, required: true },
  sortBy: { type: String as PropType<Sorting['sortBy']>, required: true },
  sortingOrder: { type: String as PropType<Sorting['sortingOrder']>, default: null },
})

const emit = defineEmits<{
  (event: 'edit-user', user: User): void
  (event: 'delete-user', user: User): void
  (event: 'update:sortBy', sortBy: Sorting['sortBy']): void
  (event: 'update:sortingOrder', sortingOrder: Sorting['sortingOrder']): void
}>()

const users = toRef(props, 'users')
const sortByVModel = useVModel(props, 'sortBy', emit)
const sortingOrderVModel = useVModel(props, 'sortingOrder', emit)

const roleColors: Record<UserRole, string> = {
  admin: 'danger',
  user: 'background-element',
  owner: 'warning',
}

const totalPages = computed(() => Math.ceil(props.pagination.total / props.pagination.perPage))

const { confirm } = useModal()

const onUserDelete = async (user: User) => {
  const agreed = await confirm({
    title: 'Delete user',
    message: `Are you sure you want to delete ${user.fullname}?`,
    okText: 'Delete',
    cancelText: 'Cancel',
    size: 'small',
    maxWidth: '380px',
  })

  if (agreed) {
    emit('delete-user', user)
  }
}

const formatProjectNames = (projects: Project['id'][]) => {
  const names = projects.reduce((acc, p) => {
    const project = props.projects?.find(({ id }) => p === id)

    if (project) {
      acc.push(project.project_name)
    }

    return acc
  }, [] as string[])
  if (names.length === 0) return 'No projects'
  if (names.length <= 2) {
    return names.map((name) => name).join(', ')
  }

  return (
    names
      .slice(0, 2)
      .map((name) => name)
      .join(', ') +
    ' + ' +
    (names.length - 2) +
    ' more'
  )
}
</script>

<template>
  <VaDataTable
    v-model:sort-by="sortByVModel"
    v-model:sorting-order="sortingOrderVModel"
    :columns="columns"
    :items="users"
    :loading="$props.loading"
  >
    <template #cell(name)="{ rowData }">
      <div class="flex items-center gap-2 max-w-[230px] ellipsis">
        <UserAvatar :user="rowData as User" size="small" />
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

    <template #cell(dir)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.dir }}
      </div>
    </template>

    <template #cell(phoneNums)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.phoneNums }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div class="flex gap-2 justify-end">
        <VaButton
          preset="primary"
          size="small"
          icon="mso-edit"
          aria-label="Edit user"
          @click="$emit('edit-user', rowData as User)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="mso-delete"
          color="danger"
          aria-label="Delete user"
          @click="onUserDelete(rowData as User)"
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
