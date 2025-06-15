import { defineStore } from 'pinia'
import { getLabTests, addLabTest, updateLabTest, removeLabTest } from '../pages/laboratory/composables/useLaboratory'

export const useLaboratoryStore = defineStore('laboratory', {
  state: () => ({
    items: [],
    loading: false,
  }),
  actions: {
    async load() {
      this.loading = true
      this.items = await getLabTests()
      this.loading = false
    },
    async add(test) {
      const newTest = await addLabTest(test)
      this.items.push(newTest)
    },
    async update(test) {
      const updated = await updateLabTest(test)
      const idx = this.items.findIndex(t => t.id === test.id)
      if (idx !== -1) this.items.splice(idx, 1, updated)
    },
    async remove(id) {
      await removeLabTest(id)
      this.items = this.items.filter(t => t.id !== id)
    },
  },
})