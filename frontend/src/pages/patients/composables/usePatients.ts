import { Ref, ref, unref, watch, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import type { Filters, Pagination, Sorting } from '../../../data/pages/patients'
import { Patient } from '../patient.types'
import { addPatient, updatePatient, removePatient, uploadAvatar } from '../../../data/pages/patients'
import { usePatientsStore } from '../../../stores/patientsStore'

const makePaginationRef = () => ref<Pagination>({ page: 1, perPage: 10, total: 0 })
const makeSortingRef = () => ref<Sorting>({ sortBy: 'fullname', sortingOrder: null })
const makeFiltersRef = () => ref<Partial<Filters>>({ isActive: true, search: '' })

export const usePatients = (options?: {
  pagination?: Ref<Pagination>
  sorting?: Ref<Sorting>
  filters?: Ref<Partial<Filters>>
}) => {
  const isLoading = ref(false)
  const error = ref()
  const patientStore = usePatientsStore()

  const { filters = makeFiltersRef(), sorting = makeSortingRef(), pagination = makePaginationRef() } = options || {}

 const fetch = async () => {
  isLoading.value = true
  try {
    const response = await patientStore.getAll({
      filters: unref(filters),
      sorting: unref(sorting),
      pagination: unref(pagination),
    })

    patients.value = response.data
    pagination.value = response.pagination
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

  const patients = computed(() => {
    const getSortItem = (obj: any, sortBy: string) => {
      if (sortBy === 'projects') {
        return obj.projects.map((project: any) => project).join(', ')
      }

      return obj[sortBy]
    }

    const paginated = patientStore.items.slice(
      (pagination.value.page - 1) * pagination.value.perPage,
      pagination.value.page * pagination.value.perPage,
    )

    if (sorting.value.sortBy && sorting.value.sortingOrder) {
      paginated.sort((a, b) => {
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

    patients,

    fetch,

    async add(patient: Patient) {
      isLoading.value = true
      try {
        return await patientStore.add(patient)
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },

    async update(patient: Patient) {
      isLoading.value = true
      try {
        return await patientStore.update(patient)
      } catch (e) {
        error.value = e
      } finally {
        isLoading.value = false
      }
    },

    async remove(patient: Patient) {
  isLoading.value = true
  try {
    await patientStore.remove(patient)

    // ✅ Get updated list from store
    await fetch()
  } catch (e) {
    error.value = e
  } finally {
    isLoading.value = false
  }
},

    async uploadAvatar(avatar: Blob) {
      const formData = new FormData()
      formData.append('avatar', avatar)
      formData.append('id', uuid())

      return patientStore.uploadAvatar(formData)
    },
  }
}
