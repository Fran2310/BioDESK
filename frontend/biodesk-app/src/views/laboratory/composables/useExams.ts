// Importa ref para la reactividad
import { ref } from 'vue'
// Importa el store de exámenes
import { useExamsStore } from '../../../stores/catalogStore'
// Tipo de examen
import type { Exam } from '../types'

// Composable para manejar la lista de exámenes
export const useExams = () => {
  // Instancia el store de exámenes
  const examsStore = useExamsStore()
  // Lista reactiva de exámenes
  const exams = ref<Exam[]>([])
  // Estado de carga
  const loading = ref(false)

  // Carga los exámenes desde el store
  const loadExams = async () => {
    loading.value = true
    await examsStore.load()
    exams.value = examsStore.exams
    loading.value = false
  }

  // Filtra los exámenes por criterio de nombre
  const filterExams = (criteria: string) => {
    return exams.value.filter(exam => exam.name.includes(criteria))
  }

  // Exporta las propiedades y funciones
  return {
    exams,
    loading,
    loadExams,
    filterExams,
  }
}
