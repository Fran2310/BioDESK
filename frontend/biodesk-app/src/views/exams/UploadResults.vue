<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'
import { medicTestRequestApi, medicTestCatalogApi } from '@/services/api'
import type { PatchMedicTestRequestData } from '@/services/interfaces/medicTestRequest'

const route = useRoute()
const router = useRouter()
const { init: notify } = useToast()

const id = Number(route.params.id)

const request = ref<PatchMedicTestRequestData | null>(null)
const catalog = ref<any>(null)

const isLoading = ref(true)
const error = ref<string | null>(null)

function goToExams() {
    router.push({ name: 'Exams'});
  }

const form = ref({
  resultProperties: {} as Record<string, string>,
  observation: ''
})

const fetchRequest = async () => {
  try {
    const res = await medicTestRequestApi.getMedicTestRequestById(String(id))
    request.value = res.data
    form.value.observation = request.value.observation || ''

    await fetchCatalog(res.data.medicTestCatalogId)

    // Inicializar campos dinámicamente desde propiedades del catálogo
    catalog.value.properties.forEach((prop: any) => {
      const propName = String(prop.name) // Asegurar que es string
      form.value.resultProperties[propName] = request.value.resultProperties?.[propName] || ''
    })
  } catch (e: any) {
    error.value = e.message || 'Error al cargar los resultados.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const fetchCatalog = async (catalogId: number) => {
  try {
    const res = await medicTestCatalogApi.getMedicTestCatalogById(String(catalogId), true)
    catalog.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar el catálogo.'
    notify({ message: error.value, color: 'danger' })
  }
}

onMounted(() => {
  fetchRequest()
})

const submitForm = async () => {
  isLoading.value = true
  error.value = null

  try {
    const payload = {
      resultProperties: Object.fromEntries(
        Object.entries(form.value.resultProperties).filter(([_, v]) => v.trim() !== '')
      ),
      observation: form.value.observation
    }

    await medicTestRequestApi.updateMedicTestRequest(String(id), payload)
    await medicTestRequestApi.updateMedicTestRequestState(String(id), 'TO_VERIFY') // De una vez actualizar su estado

    notify({ message: 'Resultados actualizados correctamente.', color: 'success' })
    goToExams()
  } catch (e: any) {
    error.value = e.message || 'Error al actualizar los resultados.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-3xl mx-auto">
    <h1 class="text-center text-2xl font-semibold mb-4">Subir Resultados del Examen</h1>

    <VaCard>
      <VaCardContent>
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <VaProgressCircle indeterminate />
        </div>

        <div v-else>
          <div class="space-y-6">

            <!-- Result Properties Dinámicos -->
            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="property in catalog?.properties"
                :key="`prop-${property.id}-${property.name}`"
                class="p-4 border border-gray-200 rounded-lg shadow-sm"
              >
                <div class="flex justify-between items-center mb-2">
                  <h3 class="font-semibold text-lg text-primary">
                    {{ property.name }}
                  </h3>
                  <span v-if="property.unit" class="text-sm text-gray-500 italic">
                    Unidad: {{ property.unit }}
                  </span>
                </div>

                <VaInput
                  v-model="form.resultProperties[property.name]"
                  :placeholder="`Ingrese valor de ${property.name}`"
                  type="text"
                />

                <!-- Referencias -->
                <div
                  v-if="property.valueReferences?.length"
                  class="text-xs text-gray-600 mt-2"
                >
                  <strong>Valores de referencia:</strong>
                  <ul class="list-disc ml-5 mt-1">
                    <li
                      v-for="(ref, i) in property.valueReferences"
                      :key="i"
                    >
                      {{ ref.range }} ({{ ref.gender }}, {{ ref.ageGroup }})
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Notas / Observaciones -->
            <div>
              <h3 class="font-semibold text-lg text-primary mb-1">Observaciones</h3>
              <VaTextarea
                v-model="form.observation"
                placeholder="Notas adicionales del laboratorio"
                auto-grow
                :rows="3"
                max-length="500"
              />
            </div>

            <!-- Acciones -->
            <div class="flex justify-end gap-2 mt-4">
              <VaButton color="secondary" @click="router.back()">Cancelar</VaButton>
              <VaButton color="primary" :loading="isLoading" @click="submitForm">
                Guardar Resultados
              </VaButton>
            </div>

            <!-- Error -->
            <div v-if="error" class="text-danger text-center mt-2">{{ error }}</div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>
