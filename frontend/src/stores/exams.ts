import { defineStore } from 'pinia'
import { sleep } from '../services/utils'
import { Exam } from '../pages/laboratory/types'

const fetchExams = async () => {
  await sleep(1000)
  return [
    {
      id: '1',
      name: 'Blood Test',
      description: 'A test to check your blood health.',
      price: 50,
    },
    {
      id: '2',
      name: 'X-Ray',
      description: 'An imaging test to view the inside of your body.',
      price: 100,
    },
    {
      id: '3',
      name: 'MRI Scan',
      description: 'A detailed imaging test using magnetic fields.',
      price: 300,
    },
  ] as Exam[]
}

export const useExamsStore = defineStore({
  id: 'exams',
  state: () => ({
    exams: [] as Exam[],
    loading: false,
  }),
  getters: {
    allExams: (state) => state.exams,
  },
  actions: {
    async load() {
      this.loading = true
      this.exams = await fetchExams()
      this.loading = false
    },
    add(exam: Exam) {
      this.exams.push(exam)
    },
    update(exam: Exam) {
      const index = this.exams.findIndex((existingExam) => existingExam.id === exam.id)
      if (index !== -1) {
        this.exams.splice(index, 1, exam)
      }
    },
    remove(examId: string) {
      this.exams = this.exams.filter((exam) => exam.id !== examId)
    },
  },
})