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
          <va-button color="success" @click="examForm.showAddModal = true">
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
      <va-card>
        <va-card-title>
          {{ isEditing ? 'Editar examen' : 'Agregar nuevo examen' }}
        </va-card-title>
        <va-card-content>
          <form @submit.prevent="isEditing ? updateExam(fetchExams,showError) : addExam(fetchExams,showError)">
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
            
            <div class="supplies-section">
            <va-input 
              v-model="examForm.newSupply" 
              label="Agregar Insumo"
              placeholder="Escribe un insumo y presiona agregar"
            />

            <va-button
              color="primary"
              size="small"
              @click="addSupplies"
              class="custom-button"
              icon="add"
            >
            Agregar
            </va-button>

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
                  <va-card-title>{{ isEditingReference ? "Editar Valor de Referencia" : "Agregar Valor de Referencia" }}</va-card-title>
                  <va-card-content>
                    <div class="flex flex-col gap-3">
                      <va-input v-model="selectedReference.name" placeholder="Nombre del valor" />
                      <va-input v-model="selectedReference.unit" placeholder="Unidad" />
                    </div>
                  </va-card-content>
                  <va-card-actions class="flex justify-end">
                    <va-button color="secondary" @click="closeModal">Cancelar</va-button>
                    <va-button color="success" @click="handleSaveReference">Guardar</va-button>
                  </va-card-actions>
                </va-card>
              </va-modal>

              <!-- Modal para ingresar/editar combinaciones de grupo de edad, sexo y rango -->
              <va-modal v-model="showVariationModal" hide-default-actions>
                <va-card>
                  <va-card-title>{{ isEditingVariation ? "Editar Combinación" : "Agregar Combinación" }}</va-card-title>
                  <va-card-content>
                    <div class="flex flex-col gap-3">
                      <va-select v-model="selectedVariation.ageGroup" :options="ageGroups" placeholder="Grupo de edad" />
                      <va-select v-model="selectedVariation.gender" :options="genderOptions" placeholder="Sexo" />
                      <va-input v-model="selectedVariation.range" placeholder="Rango" />
                    </div>
                  </va-card-content>
                  <va-card-actions class="flex justify-end">
                    <va-button color="secondary" @click="showVariationModal = false">Cancelar</va-button>
                    <va-button color="success" @click="saveVariation" type="submit">Guardar</va-button>
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
import { onMounted } from 'vue'
import {
  VaInput, VaDataTable, VaButton, VaModal, VaCard,
  VaCardTitle, VaCardContent, VaSpacer, VaTextarea, VaSelect
} from 'vuestic-ui'

import { computed } from 'vue'

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
const search = tableState.search
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


