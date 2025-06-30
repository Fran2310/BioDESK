<script setup lang="ts">
  import { defineVaDataTableColumns, useModal } from 'vuestic-ui'
  import { computed, toRef } from 'vue'
  import type { PropType } from 'vue'
  import type { Pagination, Sorting } from '@/data/views/users'
  import { useVModel } from '@vueuse/core'
  import type { CreateUserWithRoleIdData } from '@/services/interfaces/user'


  const columns = defineVaDataTableColumns([
    { label: 'Nombre', key: 'name', sortable: true },
    { label: 'Apellido', key: 'lastName', sortable: true },
    { label: 'Cédula', key: 'ci', sortable: true },
    { label: 'Rol', key: 'roleId', sortable: true },
    { label: 'Email', key: 'email', sortable: true },
    { label: ' ', key: 'actions', align: 'right' },
  ])

  const props = defineProps({
    users: {
      type: Array as PropType<CreateUserWithRoleIdData[]>,
      required: true,
    },
    loading: { type: Boolean, default: false },
    pagination: { type: Object as PropType<Pagination>, required: true },
    sortBy: { type: String as PropType<Sorting['sortBy']>, required: true },
    sortingOrder: { type: String as PropType<Sorting['sortingOrder']>, default: null },
  })

  const emit = defineEmits<{
    (event: 'edit-user', user: CreateUserWithRoleIdData): void
    (event: 'delete-user', user: CreateUserWithRoleIdData): void
    (event: 'update:sortBy', sortBy: Sorting['sortBy']): void
    (event: 'update:sortingOrder', sortingOrder: Sorting['sortingOrder']): void
  }>()

  const users = toRef(props, 'users')
  const sortByVModel = useVModel(props, 'sortBy', emit)
  const sortingOrderVModel = useVModel(props, 'sortingOrder', emit)

  const totalPages = computed(() => Math.ceil(props.pagination.total / props.pagination.perPage))

  const { confirm } = useModal()

  const onUserDelete = async (user: CreateUserWithRoleIdData) => {
    const agreed = await confirm({
      title: 'Eliminar usuario',
      message: `Seguro que deseas eliminar a ${user.name} ${user.lastName}?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
      size: 'small',
      maxWidth: '380px',
    })

    if (agreed) {
      emit('delete-user', user)
    }
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
        {{ rowData.name }}
      </div>
    </template>

    <template #cell(lastName)="{ rowData }">
      <div class="max-w-[120px] ellipsis">
        {{ rowData.lastName }}
      </div>
    </template>

    <template #cell(ci)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.ci }}
      </div>
    </template>

    <template #cell(roleId)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.roleId }}
      </div>
    </template>

    <template #cell(email)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ rowData.email }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div class="flex gap-2 justify-center">
        <VaButton
          preset="primary"
          size="small"
          icon="mso-edit"
          aria-label="Edit user"
          @click="$emit('edit-user', rowData as CreateUserWithRoleIdData)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="mso-delete"
          color="danger"
          aria-label="Delete user"
          @click="onUserDelete(rowData as CreateUserWithRoleIdData)"
        />
      </div>
    </template>
  </VaDataTable>

  <div class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2">
    <div>
      <b>{{ $props.pagination.total }} resultados.</b>
      Resultados por página
      <VaSelect v-model="$props.pagination.perPage" class="!w-20" :options="[10, 50, 100]" />
    </div>

    <div v-if="totalPages > 1" class="flex">
      <VaButton
        preset="secondary"
        icon="va-arrow-left"
        aria-label="Página anterior"
        :disabled="$props.pagination.page === 1"
        @click="$props.pagination.page--"
      />
      <VaButton
        class="mr-2"
        preset="secondary"
        icon="va-arrow-right"
        aria-label="Página siguiente"
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

<style scoped>
.va-data-table {
  ::v-deep(.va-data-table__table-tr) {
    border-bottom: 1px solid var(--va-background-border);
  }
}
</style>
