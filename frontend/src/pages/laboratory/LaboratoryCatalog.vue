<template>
  <div class="laboratory-catalog-page">
    <va-card class="mb-6">
      <va-card-title>
        <span class="text-2xl font-bold">Catálogo de Laboratorio</span>
      </va-card-title>
      <va-card-content>
        <div class="flex flex-wrap gap-4 items-center">
          <va-input
            v-model="search"
            placeholder="Buscar examen..."
            class="w-64"
            clearable
          />
          <va-spacer />
          <va-button color="success" @click="showAddModal = true">
            Agregar examen
          </va-button>
        </div>
      </va-card-content>
    </va-card>
    <va-card>
      <va-card-content>
        <va-data-table
          :columns="columns"
          :items="filteredExams"
          :loading="loading"
          :virtual-scroller="true"
          class="shadow rounded min-h-[200px]"
        >
          <template #cell(supplies)="{ value }">
            <span v-if="Array.isArray(value)">{{ value.join(', ') }}</span>
            <span v-else>-</span>
          </template>
          <template #cell(actions)="{ row }">
            <va-button
              size="small"
              color="warning"
              class="mr-2"
              @click="editExam(row)"
            >
              Editar
            </va-button>
            <va-button
              size="small"
              color="danger"
              @click="deleteExam(row)"
            >
              Eliminar
            </va-button>
          </template>
          <template #bodyAppend>
            <tr v-if="!loading && filteredExams.length === 0">
              <td :colspan="columns.length" class="text-center text-gray-500 py-8">
                No se encontraron exámenes.
              </td>
            </tr>
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <!-- Modal para agregar/editar examen -->
    <va-modal v-model="showAddModal" hide-default-actions>
      <va-card>
        <va-card-title>
          {{ isEditing ? 'Editar examen' : 'Agregar nuevo examen' }}
        </va-card-title>
        <va-card-content>
          <form @submit.prevent="isEditing ? updateExam() : addExam()">
            <va-input
              v-model="newExam.name"
              label="Nombre"
              required
              class="mb-3"
            />
            <va-input
              v-model="newExam.description"
              label="Descripción"
              class="mb-3"
            />
            <va-input
              v-model="newExam.suppliesText"
              label="Insumos (separados por coma)"
              class="mb-3"
            />
            <va-input
              v-model.number="newExam.price"
              label="Precio"
              type="number"
              min="0"
              class="mb-3"
            />
            <div class="mb-3">
              <label class="block mb-1 font-semibold">Propiedades adicionales</label>
              <div v-for="(pair, idx) in propertiesPairs" :key="idx" class="flex gap-2 mb-2">
                <va-input
                  v-model="pair.key"
                  placeholder="Clave"
                  class="flex-1"
                  size="small"
                />
                <va-input
                  v-model="pair.value"
                  placeholder="Valor"
                  class="flex-1"
                  size="small"
                />
                <va-button
                  icon="delete"
                  color="danger"
                  size="small"
                  @click="removeProperty(idx)"
                  class="self-center"
                  aria-label="Eliminar propiedad"
                />
              </div>
              <va-button
                color="primary"
                size="small"
                @click="addProperty"
                class="mt-1"
                icon="add"
              >
                Agregar propiedad
              </va-button>
            </div>
            <div class="flex gap-2 justify-end mt-4">
              <va-spacer />
              <va-button color="secondary" @click="closeModal" type="button">
                Cancelar
              </va-button>
              <va-button color="primary" type="submit">
                Guardar
              </va-button>
            </div>
          </form>
        </va-card-content>
      </va-card>
    </va-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { VaInput, VaDataTable, VaButton, VaModal, VaCard, VaCardTitle, VaCardContent, VaSpacer, VaTextarea } from 'vuestic-ui'

interface MedicTestCatalog {
  id: number
  name: string
  description?: string
  properties?: any
  supplies: string[]
  price: number
}

const search = ref('')
const exams = ref<MedicTestCatalog[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const isEditing = ref(false)
const editingExamId = ref<number | null>(null)

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'description', label: 'Descripción' },
  { key: 'supplies', label: 'Insumos' },
  { key: 'price', label: 'Precio', sortable: true },
  { key: 'actions', label: 'Acciones' },
]

const fetchExams = async () => {
  loading.value = true
  try {
    // Cambia la URL por la de tu backend real
    const res = await fetch('/api/medic-test-catalog')
    if (res.ok) {
      exams.value = await res.json()
    } else {
      // fallback de ejemplo
      exams.value = [
        {
          id: 1,
          name: 'Hemograma',
          description: 'Examen de sangre completo',
          supplies: ['Tubo EDTA', 'Aguja'],
          price: 120,
        },
        {
          id: 2,
          name: 'Glucosa',
          description: 'Medición de glucosa en sangre',
          supplies: ['Tubo fluoruro', 'Aguja'],
          price: 80,
        },
      ]
    }
  } catch (e) {
    // fallback de ejemplo
    exams.value = [
      {
        id: 1,
        name: 'Hemograma',
        description: 'Examen de sangre completo',
        supplies: ['Tubo EDTA', 'Aguja'],
        price: 120,
      },
      {
        id: 2,
        name: 'Glucosa',
        description: 'Medición de glucosa en sangre',
        supplies: ['Tubo fluoruro', 'Aguja'],
        price: 80,
      },
    ]
  }
  loading.value = false
}

const filteredExams = computed(() => {
  if (!search.value) return exams.value
  return exams.value.filter(e =>
    e.name.toLowerCase().includes(search.value.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(search.value.toLowerCase()))
  )
})

const propertiesError = ref('')

const newExam = ref({
  name: '',
  description: '',
  suppliesText: '',
  price: 0,
  propertiesText: '',
})

const propertiesPairs = ref<{ key: string; value: string }[]>([])

function addProperty() {
  propertiesPairs.value.push({ key: '', value: '' })
}

function removeProperty(idx: number) {
  propertiesPairs.value.splice(idx, 1)
}

function propertiesFromPairs() {
  const obj: Record<string, any> = {}
  for (const { key, value } of propertiesPairs.value) {
    if (key.trim()) obj[key.trim()] = value
  }
  return Object.keys(obj).length ? obj : undefined
}

function pairsFromProperties(obj: any) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }))
}

function closeModal() {
  showAddModal.value = false
  isEditing.value = false
  editingExamId.value = null
  propertiesError.value = ''
  newExam.value = { name: '', description: '', suppliesText: '', price: 0, propertiesText: '' }
  propertiesPairs.value = []
}

function addExam() {
  if (!newExam.value.name) return
  const properties = propertiesFromPairs()
  exams.value.push({
    id: exams.value.length ? Math.max(...exams.value.map(e => e.id)) + 1 : 1,
    name: newExam.value.name,
    description: newExam.value.description,
    supplies: newExam.value.suppliesText
      ? newExam.value.suppliesText.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    price: newExam.value.price,
    properties,
  })
  closeModal()
}

function editExam(row: MedicTestCatalog) {
  isEditing.value = true
  editingExamId.value = row.id
  newExam.value = {
    name: row.name,
    description: row.description || '',
    suppliesText: row.supplies ? row.supplies.join(', ') : '',
    price: row.price,
    propertiesText: '',
  }
  propertiesPairs.value = pairsFromProperties(row.properties)
  propertiesError.value = ''
  showAddModal.value = true
}

function updateExam() {
  if (editingExamId.value === null) return
  const properties = propertiesFromPairs()
  const idx = exams.value.findIndex(e => e.id === editingExamId.value)
  if (idx !== -1) {
    exams.value[idx] = {
      id: editingExamId.value,
      name: newExam.value.name,
      description: newExam.value.description,
      supplies: newExam.value.suppliesText
        ? newExam.value.suppliesText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      price: newExam.value.price,
      properties,
    }
  }
  closeModal()
}

function deleteExam(row: MedicTestCatalog) {
  exams.value = exams.value.filter(e => e.id !== row.id)
}

function viewDetails(row: MedicTestCatalog) {
  // Aquí puedes abrir un modal o navegar a una página de detalles
  alert(`Detalles de: ${row.name}`)
}

onMounted(fetchExams)
</script>

<style scoped>
.laboratory-catalog-page {
  padding: 24px;
}
</style>
