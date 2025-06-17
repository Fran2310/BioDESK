// patientsStore.ts

import { defineStore } from 'pinia'
import { Patient } from '/pages/patients/patient.types'
import { mockPatients } from '/src/data/mockPatients'

export const usePatientsStore = defineStore('patients', {
  state: () => ({
    items: [...mockPatients],
    pagination: {
      page: 1,
      perPage: 10,
      total: mockPatients.length,
    },
  }),

  actions: {
   async getAll(options: { filters?: any; pagination?: any }) {
  let filtered = [...this.$state.items] // always start with full list

  if (options.filters?.search) {
    const query = options.filters.search.toLowerCase()
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.ci.includes(query)
    )
  }

  const start = (options.pagination?.page - 1) * options.pagination?.perPage
  const end = options.pagination?.page * options.pagination?.perPage

  const paginated = filtered.slice(start, end)

  this.pagination = {
    page: options.pagination?.page || 1,
    perPage: options.pagination?.perPage || 10,
    total: filtered.length,
  }

  return {
    data: paginated,
    pagination: this.pagination,
  }
},

    async add(patient: Patient): Promise<Patient> {
      const newPatient = { ...patient, id: generateId() }
      this.items.unshift(newPatient)
      this.pagination.total++
      return newPatient
    },

    async update(updatedPatient: Patient): Promise<Patient> {
      const index = this.items.findIndex(p => p.id === updatedPatient.id)
      if (index !== -1) {
        this.items[index] = updatedPatient
      }
      return updatedPatient
    },

    async remove(patient: Patient) {
      this.items = this.items.filter(p => p.id !== patient.id)
      this.pagination.total--
      return true
    },

    async uploadAvatar(formData: FormData) {
      const avatar = formData.get('avatar') as Blob
      const publicUrl = URL.createObjectURL(avatar)
      return { publicUrl }
    },
  },
})

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}