import { ref, unref, watch, computed } from 'vue'
import type { Ref } from 'vue'
import type { Filters, Pagination, Sorting } from '@/data/views/users'
import { useUsersStore } from '@/stores/users'
import type { CreateUserWithRoleIdData } from '@/services/interfaces/user'

const makePaginationRef = () => ref<Pagination>({ page: 1, perPage: 10, total: 0 })
const makeSortingRef = () => ref<Sorting>({ sortBy: 'ci', sortingOrder: null })
const makeFiltersRef = () => ref<Partial<Filters>>({ search: '' })

export const useUsers = (options?: {
  pagination?: Ref<Pagination>
  sorting?: Ref<Sorting>
  filters?: Ref<Partial<Filters>>
}) => {
  const isLoading = ref(false)
  const error = ref()
  const usersStore = useUsersStore()

  const { filters = makeFiltersRef(), sorting = makeSortingRef(), pagination = makePaginationRef() } = options || {}

  const fetch = async () => {
    isLoading.value = true
    try {
      await usersStore.getAll({
        filters: unref(filters),
        sorting: unref(sorting),
        pagination: unref(pagination),
      })
      pagination.value = usersStore.pagination
    } finally {
      isLoading.value = false
    }
  }

  watch(
    filters,
    () => {
      // Reset pagination to first page when filters changed
      pagination.value.page = 1
      fetch()
    },
    { deep: true },
  )

  fetch()

  const users = computed(() => {
    const getSortItem = (obj: any, sortBy: string) => {
      return obj[sortBy]
    }

    const paginated = usersStore.items.slice(
      (pagination.value.page - 1) * pagination.value.perPage,
      pagination.value.page * pagination.value.perPage,
    )

    if (sorting.value.sortBy && sorting.value.sortingOrder) {
      paginated.sort((a: any, b: any) => {
        const first = getSortItem(a, sorting.value.sortBy!)
        const second = getSortItem(b, sorting.value.sortBy!)
        if (first > second) {
          return sorting.value.sortingOrder === 'asc' ? 1 : -1
        }
        if (first < second) {
          return sorting.value.sortingOrder === 'asc' ? -1 : 1
        }
        return 0
      })
    }
    return paginated
  })

  return {
    error,
    isLoading,
    filters,
    sorting,
    pagination,

    users,

    fetch,

    async add(user: CreateUserWithRoleIdData) {
      isLoading.value = true
      try {
        return await usersStore.add(user)
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },

    async update(user: CreateUserWithRoleIdData) {
      isLoading.value = true
      try {
        return await usersStore.update(user)
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },

    async remove(user: CreateUserWithRoleIdData) {
      isLoading.value = true
      try {
        return await usersStore.remove(user)
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    }
  }
}
