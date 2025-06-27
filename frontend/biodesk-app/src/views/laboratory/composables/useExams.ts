import { ref } from 'vue'
import { useExamsStore } from '../../../stores/exams'
import { Exam } from '../types'

export const useExams = () => {
  const examsStore = useExamsStore()
  const exams = ref<Exam[]>([])
  const loading = ref(false)

  const loadExams = async () => {
    loading.value = true
    await examsStore.load()
    exams.value = examsStore.exams
    loading.value = false
  }

  const filterExams = (criteria: string) => {
    return exams.value.filter(exam => exam.name.includes(criteria))
  }

  return {
    exams,
    loading,
    loadExams,
    filterExams,
  }
}
