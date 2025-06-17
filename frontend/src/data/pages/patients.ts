import { Patient } from '../../pages/patients/patient.types'
import api from '../../services/api'

export type Pagination = {
  page: number
  perPage: number
  total: number
}

export type Sorting = {
  sortBy: keyof Patient | undefined
  sortingOrder: 'asc' | 'desc' | null
}

export type Filters = {
  isActive: boolean
  search: string
}

export const getPatients = async (filters: Partial<Filters & Pagination & Sorting>) => {
  const { isActive, search } = filters
  let filteredPatients: Patient[] = await fetch(api.allPatients()).then((r) => r.json())

  if (isActive !== undefined) {
  filteredPatients = filteredPatients.filter((p) => p.active === isActive)
}

  if (search) {
    filteredPatients = filteredPatients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
             p.lastName.toLowerCase().includes(search.toLowerCase()) ||
             p.ci.toLowerCase().includes(search.toLowerCase()))
  }

  const { page = 1, perPage = 10 } = filters || {}
  const start = (page - 1) * perPage
  const end = page * perPage
  const paginatedData = filteredPatients.slice(start, end)

  return {
    data: paginatedData,
    pagination: {
      page,
      perPage,
      total: filteredPatients.length,
    },
  }
}

export const addPatient = async (patient: Patient) => {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const result = await fetch(api.allPatients(), { method: 'POST', body: JSON.stringify(patient), headers }).then((r) =>
    r.json(),
  )

  if (!result.error) {
    return result
  }

  throw new Error(result.error)
}

export const updatePatient = async (patient: Patient) => {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const result = await fetch(api.patient(patient.id), { method: 'PUT', body: JSON.stringify(patient), headers }).then((r) =>
    r.json(),
  )

  if (!result.error) {
    return result
  }

  throw new Error(result.error)
}

export const removePatient = async (patient: Patient) => {
  return fetch(api.patient(patient.id), { method: 'DELETE' })
}

export const uploadAvatar = async (body: FormData) => {
  return fetch(api.avatars(), { method: 'POST', body, redirect: 'follow' }).then((r) => r.json())
}
