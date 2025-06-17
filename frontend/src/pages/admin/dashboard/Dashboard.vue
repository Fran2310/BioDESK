<script lang="ts" setup>
import RevenueUpdates from './cards/RevenueReport.vue'
import ProjectTable from './cards/ProjectTable.vue'
import RevenueByLocationMap from './cards/RevenueByLocationMap.vue'
import DataSection from './DataSection.vue'
import YearlyBreakup from './cards/YearlyBreakup.vue'
import MonthlyEarnings from './cards/MonthlyEarnings.vue'
import RegionRevenue from './cards/RegionRevenue.vue'
import Timeline from './cards/Timeline.vue'
import { useAuthStore } from '../../../stores/authStore'

import { ref, computed } from 'vue'
import { useToast } from 'vuestic-ui'

const { init } = useToast()

const authStore = useAuthStore()
const showModal = ref(true)
const showAddLabModal = ref(false)

// Formulario reactivo para agregar laboratorio
const newLabForm = ref({
  name: '',
  rif: '',
  dir: '',
  phoneNums: ['', '']
})

// Estado para mostrar carga
const isLoading = ref(false)

// Cerrar modales
const closeModal = () => {
  showModal.value = false
}

const closeAddLabModal = () => {
  showAddLabModal.value = false
  // Limpiar formulario
  newLabForm.value = {
    name: '',
    rif: '',
    dir: '',
    phoneNums: ['', '']
  }
}

// Función para validar campos
const validate = (): boolean => {
  const { name, rif, dir, phoneNums } = newLabForm.value

  if (!name || !rif || !dir || !phoneNums[0]) {
    init({ message: 'Complete todos los campos obligatorios', color: 'warning' })
    return false
  }

  if (!/^[JjGg][0-9]{9}$/.test(rif)) {
    init({ message: 'Formato inválido de RIF', color: 'danger' })
    return false
  }

  if (!/^\d{11}$/.test(phoneNums[0])) {
    init({ message: 'Teléfono principal inválido', color: 'danger' })
    return false
  }

  return true
}

// Enviar formulario
const submitNewLab = async () => {
  if (!validate()) return

  isLoading.value = true

  try {
    const res = await fetch('https://biodesk.onrender.com/api/lab/create',  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(newLabForm.value)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Error ${res.status}: ${errorText}`)
    }

    const createdLab = await res.json()

    // Añadir el nuevo laboratorio al store
    authStore.addLab(createdLab)

    init({ message: 'Laboratorio agregado correctamente', color: 'success' })
    closeAddLabModal()
  } catch (e: any) {
    console.error(e)
    init({ message: e.message || 'No se pudo crear el laboratorio', color: 'danger' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <h1 class="page-title font-bold">Dashboard</h1>

  <div class="p-6">
    <!-- Welcome Modal -->
    <VaModal v-model="showModal" title="Bienvenido" size="medium" hide-default-actions :close-on-click-outside="false">
      <div class="p-4 max-w-xl mx-auto">
        <h2 class="font-bold text-xl mb-4">Laboratorios Asignados</h2>

        <!-- Laboratorios como cards -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <VaCard v-for="lab in authStore.labs" :key="lab.id" class="p-3 text-center">
            <div class="font-semibold">{{ lab.name }}</div>
            <div class="text-sm text-gray-600">RIF: {{ lab.rif }}</div>
          </VaCard>

          <!-- Card de "Agregar Laboratorio" -->
          <VaCard
            color="tertiary"
            outlined
            text-color="white"
            class="p-3 text-center cursor-pointer flex items-center justify-center h-full"
            @click="showAddLabModal = true"
          >
            <span class="text-3xl font-bold">+</span>
            <span class="ml-2 font-medium">Agregar</span>
          </VaCard>
        </div>

        <div class="flex justify-end mt-2">
          <VaButton @click="closeModal">Cerrar</VaButton>
        </div>
      </div>
    </VaModal>

    <!-- Modal para agregar laboratorio -->
    <VaModal v-model="showAddLabModal" title="Agregar Laboratorio" size="medium" hide-default-actions>
      <div class="p-4 max-w-xl mx-auto">
        <VaInput v-model="newLabForm.name" label="Nombre del laboratorio" class="mb-4" />
        <VaInput v-model="newLabForm.rif" label="RIF del laboratorio" class="mb-4" />
        <VaInput v-model="newLabForm.dir" label="Dirección del laboratorio" class="mb-4" />
        <VaInput v-model="newLabForm.phoneNums[0]" label="Teléfono principal" class="mb-4" />
        <VaInput v-model="newLabForm.phoneNums[1]" label="Teléfono secundario (opcional)" class="mb-4" />

        <div class="flex justify-end">
          <VaButton preset="secondary" @click="closeAddLabModal" class="mr-2">Cancelar</VaButton>
          <VaButton @click="submitNewLab" :loading="isLoading">Guardar</VaButton>
        </div>
      </div>
    </VaModal>

    <!-- Dashboard Content -->
    <h1 class="text-3xl font-semibold mb-4">Panel Principal</h1>
    <p>¡Bienvenido!</p>
  </div>

  <!-- Aquí va el contenido del dashboard original si lo deseas reintegrar después -->
  <section class="flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- <RevenueUpdates class="bg red w-full sm:w-[70%]" />
      <div class="  flex flex-col gap-4 w-full sm:w-[30%]">
        <YearlyBreakup class="h-full" />
        <MonthlyEarnings />
      </div> -->
    </div>
   <!--  <DataSection />
    <div class="flex flex-col md:flex-row gap-4">
      <RevenueByLocationMap class="w-full md:w-4/6" />
      <RegionRevenue class="w-full md:w-2/6" />
    </div>
    <div class="flex flex-col md:flex-row gap-4">
      <ProjectTable class="w-full md:w-1/2" />
      <Timeline class="w-full md:w-1/2" />
    </div> -->
  </section>
</template>
