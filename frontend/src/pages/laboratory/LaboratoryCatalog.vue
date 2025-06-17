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
          <span>{{ Array.isArray(value) ? value.length : 0 }}</span>
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

            <div class="insumos-section">
            <va-input
              v-model="newInsumo"
              label="Agregar Insumo"
              placeholder="Escribe un insumo y presiona agregar"
            />

            <va-button
              color="primary"
              size="small"
              @click="addInsumo"
              class="custom-button"
              icon="add"
            >
            Agregar
            </va-button>

            <!-- Lista de insumos -->
            <ul>
              <li v-for="(insumo, index) in insumos" :key="index">
                {{ insumo }}
                <va-button
                  icon="close"
                  color="danger"
                  size="small"
                  @click="removeInsumo(index)"
                />
              </li>
            </ul>
          </div>

            <va-input
              v-model.number="newExam.price"
              label="Precio"
              type="number"
              min="0"
              class="mb-3"
            />

            <!-- Propiedades-->

            <div class="mb-3">
              <label class="block mb-3 especial">PROPIEDADES</label>

              <!-- Lista de nombres y unidades con sus combinaciones -->
              <div v-for="(reference, idx) in referenceData" :key="idx" class="reference-block">
                <div class="header">
                  <span class="reference-name">{{ reference.name }}</span>
                  <span class="reference-unit">{{ reference.unit }}</span>
                  <va-button icon="delete" color="danger" size="small" @click.stop="removeReference(idx)" />
                </div>

                <div class="variations">
                  <div v-for="(variation, vIdx) in reference.variations" :key="vIdx" class="variation-row">
                    <span class="variation-detail">{{ variation.ageGroup }}</span>
                    <span class="variation-detail">{{ variation.gender }}</span>
                    <span class="variation-detail">{{ variation.range }}</span>
                    <va-button
                      icon="delete"
                      color="danger"
                      size="small"
                      @click="removeVariation(idx, vIdx)"
                    />
                  </div>
                </div>

                <va-button color="primary" size="small" @click="openModalForNewVariation(idx)" class="custom-button" icon="add">
                  Agregar Referencia
                </va-button>
              </div>

              <!-- Botón para abrir el modal y agregar un nuevo nombre/unidad -->
              <va-button color="primary" size="small" @click="openModalForNewReference" class="custom-button" icon="add">
                Agregar Propiedad
              </va-button>

              <!-- Modal para ingresar/editar nombre y unidad -->
              <va-modal v-model="showModal" hide-default-actions>
                <va-card>
                  <va-card-title>{{ isEditingReference ? "Editar Propiedad" : "Agregar Propiedad" }}</va-card-title>
                  <va-card-content>
                    <div class="flex flex-col gap-3">
                      <va-input v-model="selectedReference.name" placeholder="Nombre del valor" />
                      <va-input v-model="selectedReference.unit" placeholder="Unidad" />
                    </div>
                  </va-card-content>
                  <va-card-actions class="flex justify-end">
                    <va-button color="secondary" @click="showModal = false">Cancelar</va-button>
                    <va-button color="success" @click="saveReference">Guardar</va-button>
                  </va-card-actions>
                </va-card>
              </va-modal>

              <!-- Modal para ingresar/editar combinaciones de grupo de edad, sexo y rango -->
              <va-modal v-model="showVariationModal" hide-default-actions>
                <va-card>
                  <va-card-title>{{ isEditingVariation ? "Editar Valor de Referencia" : "Agregar Valor de Referencia" }}</va-card-title>
                  <va-card-content>
                    <div class="flex flex-col gap-3">
                      <va-select v-model="selectedVariation.ageGroup" :options="ageGroups" placeholder="Grupo de edad" />
                      <va-select v-model="selectedVariation.gender" :options="genderOptions" placeholder="Sexo" />
                      <va-input v-model="selectedVariation.range" placeholder="Rango" />
                    </div>
                  </va-card-content>
                  <va-card-actions class="flex justify-end">
                    <va-button color="secondary" @click="showVariationModal = false">Cancelar</va-button>
                    <va-button color="success" @click="saveVariation">Guardar</va-button>
                  </va-card-actions>
                </va-card>
              </va-modal>
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


//para el manejo de referencias
const referenceValues = ref([
  { ageGroup: "adult", sex: "any", value: "120-140" },
]); // Lista de valores de referencia



const insumos = ref([]); // Lista de insumos
const newInsumo = ref(""); // Nuevo insumo

function addInsumo() {
  if (newInsumo.value && insumos.value.length < 10) {
    insumos.value.push(newInsumo.value.trim());
    newInsumo.value = "";
  }
}

function removeInsumo(index) {
  insumos.value.splice(index, 1);
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
  insumos.value = [] // Limpia la lista de insumos
}

function addExam() {
  if (!newExam.value.name) return
  const properties = propertiesFromPairs()
  exams.value.push({
    id: exams.value.length ? Math.max(...exams.value.map(e => e.id)) + 1 : 1,
    name: newExam.value.name,
    description: newExam.value.description,
    supplies: [...insumos.value], // Asigna la lista de insumos correctamente
    price: newExam.value.price,
    properties,
  })
  insumos.value = [] // Limpia la lista de insumos después de guardar
  closeModal()
}

function editExam(row: any) {
  console.log('Editando examen:', row) // Para depuración
  isEditing.value = true
  editingExamId.value = row.rowData.id // Accede al ID desde rowData
  newExam.value = {
    name: row.rowData.name,
    description: row.rowData.description || '',
    suppliesText: row.rowData.supplies ? row.rowData.supplies.join(', ') : '',
    price: row.rowData.price,
    propertiesText: '',
  }
  insumos.value = [...row.rowData.supplies] // Inicializa la lista de insumos correctamente
  propertiesPairs.value = pairsFromProperties(row.rowData.properties) // Convierte las propiedades a pares clave-valor
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
      supplies: [...insumos.value], // Actualiza la lista de insumos correctamente
      price: newExam.value.price,
      properties,
    }
  }
  closeModal()
}

function deleteExam(row: any) {
  exams.value = exams.value.filter(e => e.id !== row.rowData.id)
}

function viewDetails(row: MedicTestCatalog) {
  // Aquí puedes abrir un modal o navegar a una página de detalles
  alert(`Detalles de: ${row.name}`)
}

//modal para agregar valores de referencia

const showModal = ref(false);
const showVariationModal = ref(false);
const isEditingReference = ref(false);
const isEditingVariation = ref(false);
const referenceData = ref([]);
const selectedReference = ref({ name: "", unit: "", variations: [] });
const selectedVariation = ref({ ageGroup: "", gender: "", range: "" });
const selectedReferenceIndex = ref(null);
const selectedVariationIndex = ref(null);

const ageGroups = ["CHILD", "ADULT", "ANY"];
const genderOptions = ["MALE", "FEMALE", "ANY"];


function removeVariation(referenceIndex, variationIndex) {
  referenceData.value[referenceIndex].variations.splice(variationIndex, 1);
}

function openModalForNewReference() {
  selectedReference.value = { name: "", unit: "", variations: [] };
  isEditingReference.value = false;
  showModal.value = true;
}

function editReference(index) {
  selectedReferenceIndex.value = index;
  selectedReference.value = { ...referenceData.value[index] };
  isEditingReference.value = true;
  showModal.value = true;
}

function saveReference() {
  if (isEditingReference.value) {
    referenceData.value[selectedReferenceIndex.value] = { ...selectedReference.value };
  } else {
    referenceData.value.push({ ...selectedReference.value });
  }
  showModal.value = false;
}

function removeReference(index) {
  referenceData.value.splice(index, 1);
}

function openModalForNewVariation(referenceIndex) {
  selectedReferenceIndex.value = referenceIndex;
  selectedVariation.value = { ageGroup: "", gender: "", range: "" };
  isEditingVariation.value = false;
  showVariationModal.value = true;
}

function editVariation(referenceIndex, variationIndex) {
  selectedReferenceIndex.value = referenceIndex;
  selectedVariationIndex.value = variationIndex;
  selectedVariation.value = { ...referenceData.value[referenceIndex].variations[variationIndex] };
  isEditingVariation.value = true;
  showVariationModal.value = true;
}

function saveVariation() {
  if (isEditingVariation.value) {
    referenceData.value[selectedReferenceIndex.value].variations[selectedVariationIndex.value] = { ...selectedVariation.value };
  } else {
    referenceData.value[selectedReferenceIndex.value].variations.push({ ...selectedVariation.value });
  }
  showVariationModal.value = false;
}


onMounted(fetchExams)
</script>


<style scoped>

.custom-button { /*va-button style*/
  margin-top: 10px;
  margin-bottom: 10px;
}


ul {
  display: flex;  /* Hace que los elementos estén en línea */
  gap: 12px;      /* Espaciado entre los elementos */
  flex-wrap: wrap; /* Permite que los elementos bajen si no hay espacio */
  list-style: none; /* Elimina los estilos de la lista */
  padding: 0; /* Ajusta el espaciado */
}
li {
  display: flex;
  margin-bottom: 12px;
  margin-top: 12px;
  align-items: center; /* Alinea los elementos verticalmente */
  gap: 6px; /* Espaciado entre el texto y el botón */
  background: #f9f9f9; /* Opcional: fondo para los ítems */
  padding: 8px 12px;
  border-radius: 6px;
}

.especial {
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.4px;
  min-height: 14px;
  --va-font-family: 'Inter', sans-serif;
  font-weight: bold;
  color: var(--va-primary);
}

.mb-3 {
  margin-bottom: 16px;
}

.espcial-2{
  display: flex;
  flex-wrap: wrap; /* Permite que los elementos bajen si no hay espacio */
  gap: 12px; /* Espaciado entre elementos */

}

.card {
  min-width: 180px;
  padding: 10px;
  cursor: pointer; /* Hace que la tarjeta parezca interactiva */
}

.reference-block {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: #f9f9f9;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 8px;
}

.reference-name {
  font-size: 16px;
  color: #333;
}

.reference-unit {
  font-size: 14px;
  color: #666;
}

.variations {
  margin-top: 8px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
}

.variation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.variation-detail {
  font-size: 14px;
  color: #555;
}

</style>


