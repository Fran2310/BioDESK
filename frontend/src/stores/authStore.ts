// /src/stores/authStore.ts

import { defineStore } from 'pinia'

export interface Lab {
  id: number
  name: string
  status: 'active' | 'inactive'
  rif: string
}

interface AuthState {
  token: string | null
  labs: Lab[]
  currentLab: Lab | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || null,
    labs: [],
    currentLab: null,
  }),

  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setLabs(labs: Lab[]) {
      this.labs = labs
    },

    setCurrentLab(lab: Lab) {
      this.currentLab = lab
    },

    addLab(lab: Lab) {
    this.labs.push(lab)
  },

    clearAuth() {
      this.token = null
      this.labs = []
      this.currentLab = null
      localStorage.removeItem('token')
    },
  },
})