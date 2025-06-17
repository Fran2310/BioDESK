import { Ref, ref, unref, watch, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { useLaboratoryStore } from '../../../stores/laboratoryStore'
import api from '../../../services/api'

const makePaginationRef = () => ref({ page: 1, perPage: 10, total: 0 })
const makeSortingRef = () => ref({ sortBy: 'name', sortingOrder: null })
const makeFiltersRef = () => ref({ search: '' })

export const useLaboratory = (options?: {
  pagination?: Ref<any>
  sorting?: Ref<any>
  filters?: Ref<any>
}) => {
  const isLoading = ref(false)
  const error = ref()
  const laboratoryStore = useLaboratoryStore()

  const { filters = makeFiltersRef(), sorting = makeSortingRef(), pagination = makePaginationRef() } = options || {}

  const fetch = async () => {
    isLoading.value = true
    try {
      await laboratoryStore.load()
      // No server-side pagination/sorting in mock, so just update pagination
      pagination.value.total = laboratoryStore.items.length
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  watch(
    filters,
    () => {
      pagination.value.page = 1
      fetch()
    },
    { deep: true }
  )

  fetch()

  const exams = computed(() => {
    let filtered = laboratoryStore.items
    if (filters.value.search) {
      const q = filters.value.search.toLowerCase()
      filtered = filtered.filter(
        (e: any) =>
          e.name.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      )
    }
    // Pagination
    const start = (pagination.value.page - 1) * pagination.value.perPage
    const end = pagination.value.page * pagination.value.perPage
    return filtered.slice(start, end)
  })

  return {
    error,
    isLoading,
    filters,
    sorting,
    pagination,
    exams,
    fetch,
    async add(exam: any) {
      isLoading.value = true
      try {
        await laboratoryStore.add(exam)
        await fetch()
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },
    async update(exam: any) {
      isLoading.value = true
      try {
        await laboratoryStore.update(exam)
        await fetch()
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },
    async remove(id: any) {
      isLoading.value = true
      try {
        await laboratoryStore.remove(id)
        await fetch()
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },
  }
}

