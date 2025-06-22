// /src/stores/authStore.ts

import { defineStore } from 'pinia'

interface AuthState {
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || null,
  }),

  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    clearAuth() {
      this.token = null
      localStorage.removeItem('token')
    },
  },
})
