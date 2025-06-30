<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { medicTestRequestApi } from '@/services/api'
import { useToast } from 'vuestic-ui'

import { validator } from '@/services/utils'

import { useLabStore } from '@/stores/labStore';
import type { LabData } from '@/services/interfaces/lab'
import { medicTestCatalogApi } from '@/services/api'
import { patientApi } from '@/services/api'

import type { GetExtendQuerys } from '@/services/interfaces/global';


const form = ref({
  priority: '',
  medicHistoryId: null,
  medicTestCatalogId: null,
  observation: '',
  resultProperties: {
    glucose: '',
    hemoglobin: '',
    notes: ''
  }
})

// Inicio Prueba
const labData: LabData = {
    id: 29,
    name: "Laboratorium",
    status: "active",
    rif: "j853946049",
    logoPath: '',
};
const lab = useLabStore();
lab.setCurrentLab(labData);
// Fin prueba

const isLoading = ref(false)
const error = ref<string | null>(null)
const { init: notify } = useToast();

const submitForm = async () => {
  isLoading.value = true
  error.value = null
  try {
    // Prepare payload (remove empty resultProperties fields)
    const payload = {
      ...form.value,
      resultProperties: Object.fromEntries(
        Object.entries(form.value.resultProperties).filter(([_, v]) => v !== '')
      )
    }
    await medicTestRequestApi.createMedicTestRequest(payload)
    notify({ message: 'Request submitted successfully!', color: 'success' })
    // Optionally reset form
    form.value = {
      priority: '',
      medicHistoryId: null,
      medicTestCatalogId: null,
      observation: '',
      resultProperties: { glucose: '', hemoglobin: '', notes: '' }
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to submit request.'
    notify({ message: error.value, color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const medicTestsCatalog = ref<any[]>([])
const medicTestsCatalogLoading = ref(true)

const patients = ref<any[]>([])
const patientsLoading = ref(true)

async function fetchRoles() {
  const queries: GetExtendQuerys = {
  offset: 0,
  limit: 10,
  includeData: true
  };
  const response = await medicTestCatalogApi.getMedicTestCatalog(queries)
  medicTestsCatalog.value = Array.isArray(response.data.data) ? response.data.data : []
  medicTestsCatalogLoading.value = false
  
  console.log(medicTestsCatalog.value)
}

async function fetchPatients() {
  patientsLoading.value = true;
  const queries: GetExtendQuerys = {
  offset: 0,
  limit: 10,
  includeData: true
  };
  const response = await patientApi.getPatients(queries)
  if (Array.isArray(response.data.data)) {
      patients.value = response.data.data.map(p => ({
        ...p,
        display: `${p.ci} - ${p.name} ${p.lastName}`
      }));
  patientsLoading.value = false;
  console.log(patients.value)
  }
}

onMounted(() => {
  fetchPatients();
  fetchRoles();
});

const filterPatients = (option, query) => {
  const q = query.toLowerCase();
  return (
    option.ci?.toLowerCase().includes(q) ||
    option.name?.toLowerCase().includes(q) ||
    option.lastName?.toLowerCase().includes(q)
  );
};


const priorities = [
  { name: 'Alta', priority: 'HIGH' },
  { name: 'Media', priority: 'MEDIUM' },
  { name: 'Baja', priority: 'LOW' }
];

</script>

<template>
  <div class="p-4 md:p-6">
    <VaCard class="max-w-3xl mx-auto shadow-md">
      <VaCardContent>
        <!-- Form Container -->
        <div class="space-y-6">

          <!-- First Row: Priority, Medic History ID, Medic Test Catalog ID -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VaSelect
              v-model="form.priority"
              label="Prioridad"
              class="w-full"
              name="priority"
              :options="priorities"
              text-by="name"
              value-by="priority"
            >
              <template #prependInner>
                <VaIcon name="priority_high" />
              </template>
            </VaSelect>  

            <VaSelect
              v-model="form.medicHistoryId"
              label="Buscar paciente"
              :options="patients"
              text-by="display"
              value-by="medicHistory.id"
              searchable
              clearable
              :filter="filterPatients"
              :loading="patientsLoading"
              :disabled="patientsLoading"
            >
              <template #prependInner>
                <VaIcon name="assignment" />
              </template>
            </VaSelect>

            <VaSelect
              v-model="form.medicTestCatalogId"
              label="Catálogo"
              class="w-full"
              name="medicTestCatalogId"
              :options="medicTestsCatalog"
              :loading="medicTestsCatalogLoading"
              :disabled="medicTestsCatalogLoading"
              text-by="name"
              value-by="id"
            >
              <template #prependInner>
                <VaIcon name="science" />
              </template>
            </VaSelect>
          </div>

          <!-- Notes -->
          <VaTextarea
            label="Notas"
            v-model="form.resultProperties.notes"
            auto-grow
            :rows="3"
            counter
            max-length="500"
          />

          <!-- Esto no va acá, Miguel 
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium mb-4">Result Properties</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <VaInput label="Glucose" v-model="form.resultProperties.glucose" placeholder="e.g. 90 mg/dL">
                <template #prependInner>
                  <VaIcon name="bloodtype" />
                </template>
              </VaInput>

              <VaInput label="Hemoglobin" v-model="form.resultProperties.hemoglobin" placeholder="e.g. 12.3 g/dL">
                <template #prependInner>
                  <VaIcon name="bloodtype" />
                </template>
              </VaInput>
            </div>

            <div>
              <VaTextarea
                label="Observation"
                v-model="form.observation"
                auto-grow
                :rows="3"
                counter
                max-length="500"
              />
            </div>
          </div>
          -->

          <!-- Submit Button -->
          <div class="flex justify-end mt-6">
            <VaButton color="primary" :loading="isLoading" @click="submitForm" class="ml-2">
              Crear Petición
            </VaButton>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="text-danger text-center">{{ error }}</div>
          
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>
