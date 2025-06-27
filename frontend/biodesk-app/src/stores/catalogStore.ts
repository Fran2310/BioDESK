import { defineStore } from 'pinia'
import { medicTestCatalogApi } from '../services/api'
import type { Exam } from '../views/laboratory/types'
import { ref } from 'vue'

const fetchExams = async () => {
  const response = await medicTestCatalogApi.getMedicTestCatalog({
    offset: 0,
    limit: 100,
    includeData: true,
  })
  return response.data as Exam[]
}

export const useExamsStore = defineStore('exams', () => {
  const exams = ref<Exam[]>([])
  const loading = ref(false)

  const load = async () => {
    loading.value = true
    exams.value = await fetchExams()
    loading.value = false
  }

  const add = (exam: Exam) => {
    exams.value.push(exam)
  }

  const update = (exam: Exam) => {
    const index = exams.value.findIndex((existingExam) => existingExam.id === exam.id)
    if (index !== -1) {
      exams.value.splice(index, 1, exam)
    }
  }

  const remove = (examId: string) => {
    exams.value = exams.value.filter((exam) => exam.id !== examId)
  }

  return {
    exams,
    loading,
    load,
    add,
    update,
    remove,
  }
})