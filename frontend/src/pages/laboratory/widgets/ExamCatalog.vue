<template>
  <div class="exam-catalog">
    <h2 class="text-xl font-bold mb-4">Catálogo de Exámenes</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div v-if="filteredExams.length === 0" class="text-gray-500 mt-8">
      No se encontraron exámenes.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExams } from '../composables/useExams'

const props = defineProps<{ filter?: string }>()

const { exams, loadExams } = useExams()

loadExams()

const filteredExams = computed(() => {
  if (!props.filter) return exams.value
  return exams.value.filter(exam =>
    exam.name.toLowerCase().includes(props.filter.toLowerCase())
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