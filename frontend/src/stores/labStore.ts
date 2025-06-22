import { defineStore } from 'pinia'

export interface Lab {
  id: number
  name: string
  status: 'active' | 'inactive'
  rif: string
  phoneNums?: string[]
}

interface LabState {
  labs: Lab[]
  currentLab: Lab | null
}

export const useLabStore = defineStore('lab', {
  state: (): LabState => ({
    labs: [],
    currentLab: null,
  }),

  actions: {
    setLabs(labs: Lab[]) {
      this.labs = labs
    },
    setCurrentLab(lab: Lab) {
      this.currentLab = lab
    },
    addLab(lab: Lab) {
      this.labs.push(lab)
    },
    clearLabs() {
      this.labs = []
      this.currentLab = null
    },
    async fetchLabs(token: string) {
      // Fetch labs from backend using the provided token
      const response = await fetch('https://biodesk.onrender.com/api/labs', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch labs')
      }
      const data = await response.json()
      this.labs = data.labs || [] // Adjust if backend response shape is different
      return this.labs
    },
  },
})
