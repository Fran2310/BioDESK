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
          <va-button color="#2F6F79" @click="examForm.showAddModal = true">
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
              @click="deleteExam(row, fetchExams, showError)"
            >
              Eliminar
            </va-button>
          </template>
        </va-data-table>
      </va-card-content>
    </va-card>

    <!-- Modal para agregar/editar examen -->
    <va-modal v-model="examForm.showAddModal" hide-default-actions>
      <va-card class="w-full">
        <va-card-title>
          {{ isEditing ? 'Editar examen' : 'Agregar nuevo examen' }}
        </va-card-title>
        <va-card-content class="flex">
          <form @submit.prevent="isEditing ? updateExam(fetchExams,showError) : addExam(fetchExams,showError)">
            <va-input
              v-model="newExam.name"
              label="Nombre"
              required
              class="w-full mb-3"
            />
            <va-input
              v-model="newExam.description"
              label="Descripción"
              class="w-full mb-3"
            />
            
            <div class="flex gap-2 flex-wrap items-end mb-3"> <!-- <div class="flex flex-col sm:flex-row gap-2"> -->
              <div class="w-full sm:w-1/2">
                <va-input 
                v-model="examForm.newSupply" 
                label="Agregar Insumo"
                placeholder="Escribe un insumo y presiona agregar"
                class="w-5/6"
              />
              </div>

              <div class="flex items-end mt">
                <va-button 
                color="primary"
                size="small"
                @click="addSupplies"
                class="p-1">
                  Agregar 
                </va-button>
              </div>
            </div>  
              <!-- Lista de insumos -->
              <ul>
                <li v-for="(supply, index) in examForm.supplies" :key="index">
                  {{ supply }}
                  <va-button 
                    icon="close" 
                    color="danger" 
                    size="small" 
                    @click="removeSupply(index)"
                    type="button"
                  />
                </li>
              </ul>
            
            <va-input
              v-model.number="newExam.price"
              label="Precio"
              type="number"
              min="0"
              class="mb-3"
            />

            <!-- Propiedades-->

            <div class="flex flex-col">
              <label class="block mb-3 especial">PROPIEDADES</label>
              <VaCard
                stripe
                stripe-color="#2F6F79"
              >
                <!-- Fila para agregar nueva propiedad -->
                <div class="flex gap-4"> 
                  <div class="grid grid-cols-3 gap-2 m-2">
                    <va-input
                      v-model="newProperty.name"
                      placeholder="Nombre"
                      size="small"
                      class="col-span-2 w-1/1"
                    />
                    <va-input
                      v-model="newProperty.unit"
                      placeholder="Unidad"
                      size="small"
                      class="col-span-1 w-1/1"
                    />
                    <va-select
                      v-model="newProperty.variation.ageGroup"
                      :options="ageGroups"
                      placeholder="Edad"
                      size="small"
                      class="col-span-2 w-1/1"
                    />
                    <va-select
                      v-model="newProperty.variation.gender"
                      :options="genderOptions"
                      placeholder="Sexo"
                      size="small"
                      class="w-1/1"
                    />
                    <va-input
                      v-model="newProperty.variation.range"
                      placeholder="Rango"
                      size="small"
                      class="col-span-2 w-3/4"
                    />
                  </div>
                </div>
              </VaCard>
                <va-button
                  color="primary"
                  size="small"
                  @click="addPropertyDirect"
                  class="custom-button w-1/5"
                 > Añadir propiedad</va-button>
                <div
                  v-for="(reference, idx) in referenceData"
                  :key="idx"
                  class="property-block"
                >
                  <div
                    class="property-details"
                  >
                    <div class="property-name">
                      {{ reference.name }}
                    </div>
                    <div class="property-unit">
                      {{ reference.unit }}
                    </div>
                     <div class="property-range">
                      {{ reference.variations[0]?.ageGroup }}
                    </div>
                      <div class="property-range">
                      {{ reference.variations[0]?.gender }}
                    </div>
                     <div class="property-range">
                      {{ reference.variations[0]?.range }}
                    </div>
                  </div>
                  <va-button
                    icon="delete"
                    color="danger"
                    size="small"
                    @click="removeReference(idx)"
                  />
                </div>
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
import { onMounted } from 'vue'
import {
  VaInput, VaDataTable, VaButton, VaModal, VaCard,
  VaCardTitle, VaCardContent, VaSpacer, VaTextarea, VaSelect
} from 'vuestic-ui'

import { computed, ref, watch } from 'vue'

import { useLaboratoryCatalog } from './composables/useLaboratoryCatalog'

const {
  // Tabla y búsqueda
  columns,
  filteredExams,
  tableState,
  // Modal y formulario de examen
  examForm,
  addExam,
  editExam,
  updateExam,
  deleteExam,
  closeModal,
  // Insumos
  addSupplies,
  removeSupply,
  // Propiedades
  addProperty,
  removeProperty,
  // Referencias y variaciones
  referenceModal,
  removeVariation,
  saveVariation,
  openModalForNewReference,
  openModalForNewVariation,
  saveReference,
  removeReference,
  editVariation,
  // Otros
  viewDetails,
  showError,
  fetchExams,
} = useLaboratoryCatalog()




// Mapear los estados internos a los usados en el template
const search = ref(tableState.search)

watch(search, (val) => {
  tableState.search = val
})

const loading = tableState.loading
const supplies = examForm.supplies
const newSupply = examForm.newSupply
const isEditing = examForm.isEditing

const newExam = computed({
  get: () => examForm.newExam,
  set: v => examForm.newExam = v
})

// Referencias para modales y propiedades
const referenceData = referenceModal.referenceData
const showModal = referenceModal.showModal
const showVariationModal = referenceModal.showVariationModal
const selectedReference = referenceModal.selectedReference
const isEditingReference = referenceModal.isEditingReference
const selectedReferenceIndex = referenceModal.selectedReferenceIndex
const selectedVariation = referenceModal.selectedVariation
const selectedVariationIndex = referenceModal.selectedVariationIndex
const isEditingVariation = referenceModal.isEditingVariation
const ageGroups = ['CHILD', 'ADULT', 'ANY']
const genderOptions = ['MALE', 'FEMALE', 'ANY']

const newProperty = ref({
  name: '',
  unit: '',
  variation: { ageGroup: '', gender: '', range: '' }
})

function addPropertyDirect() {
  if (
    newProperty.value.name &&
    newProperty.value.unit &&
    newProperty.value.variation.ageGroup &&
    newProperty.value.variation.gender &&
    newProperty.value.variation.range
  ) {
    referenceData.value.push({
      name: newProperty.value.name,
      unit: newProperty.value.unit,
      variations: [{ ...newProperty.value.variation }]
    })
    newProperty.value = { name: '', unit: '', variation: { ageGroup: '', gender: '', range: '' } }
  }
}

function handleSaveReference() {
  const idx = saveReference()
  if (typeof idx === 'number') {
    // Espera a que el modal de referencia se cierre antes de abrir el de variación
    setTimeout(() => {
      openModalForNewVariation(idx)
    }, 0)
  }
}

onMounted(() => {
  fetchExams()
})

</script>


<style scoped>

.custom-button { /*va-button style*/ 
  margin-top: 10px; 
  margin-bottom: 10px; 
  padding: 5px;
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

.table-responsive {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 16px;
}

.table-responsive table {
  min-width: 600px;
  font-size: 13px;
}


.va-card-content {
  overflow-x: auto;
}

.property-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #f9f9f9;
}

.property-details {
  display: flex;
  flex-direction: row; /* Cambia de column a row */
  gap: 5rem;           /* Espacio entre propiedades */
  align-items: center; /* Centra verticalmente */
}

.property-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #333;
}

.property-unit {
  font-size: 1.1rem;
  color: #666;
}

.property-range{
  font-size: 1rem;
  color: #666;
}
</style>


