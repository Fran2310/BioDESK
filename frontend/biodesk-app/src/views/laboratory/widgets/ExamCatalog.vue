<template>
  <!-- Catálogo de exámenes con tarjetas -->
  <div class="exam-catalog">
    <h2 class="text-xl font-bold mb-4">Catálogo de Exámenes</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Tarjeta para cada examen -->
      <div
        v-for="exam in filteredExams"
        :key="exam.id"
        class="exam-card p-4 border rounded shadow"
      >
        <h3 class="font-semibold">{{ exam.name }}</h3>
        <p>{{ exam.description }}</p>
        <p class="text-sm text-gray-500">Duración: {{ exam.duration }} minutos</p>
        <p class="text-sm text-gray-500">Precio: ${{ exam.price }}</p>
        <button class="mt-2 bg-blue-500 text-white py-1 px-3 rounded">Ver Detalles</button>
      </div>
    </div>
    <!-- Mensaje si no hay exámenes -->
    <div v-if="filteredExams.length === 0" class="text-gray-500 mt-8">
      No se encontraron exámenes.
    </div>
  </div>
</template>

<script setup lang="ts">
// Importa helpers de Vue y el composable de exámenes
import { computed } from 'vue'
import { useExams } from '../composables/useExams'

// Props para filtrar el catálogo
const props = defineProps<{ filter?: string }>()

// Obtiene los exámenes y función para cargarlos
const { exams, loadExams } = useExams()

// Carga los exámenes al montar el componente
loadExams()

// Computed para filtrar los exámenes por nombre
const filteredExams = computed(() => {
  const filter = props.filter?.toLowerCase() || ''
  if (!filter) return exams.value
  return exams.value.filter(exam =>
    exam.name.toLowerCase().includes(filter)
  )
})
</script>

<style scoped>
.exam-catalog {
  padding: 20px;
}
.exam-card {
  transition: 0.2s;
}
.exam-card:hover {
  transform: scale(1.05);
}
</style>