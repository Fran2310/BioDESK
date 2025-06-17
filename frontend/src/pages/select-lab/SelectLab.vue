<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'vuestic-ui'
import { useAuthStore } from '../../stores/authStore'
import { useRouter } from 'vue-router'

const { init } = useToast()
const authStore = useAuthStore()

const showAddLabModal = ref(false)

const newLabForm = ref({
  name: '',
  rif: '',
  dir: '',
  phoneNums: ['', ''],
})

const isLoading = ref(false)

const closeAddLabModal = () => {
  showAddLabModal.value = false
  newLabForm.value = {
    name: '',
    rif: '',
    dir: '',
    phoneNums: ['', ''],
  }
}

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

const submitNewLab = async () => {
  if (!validate()) return

  isLoading.value = true

  try {
    const res = await fetch('https://biodesk.onrender.com/api/lab/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(newLabForm.value),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Error ${res.status}: ${errorText}`)
    }

    const createdLab = await res.json()
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
const { push } = useRouter()
const selectLabInit = async (lab) => {
  authStore.setCurrentLab(lab)
  push({ name: 'homepage' })
}
</script>

<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="font-bold text-2xl mb-6">Laboratorios Asignados</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <VaButton v-for="lab in authStore.labs" :key="lab.id" class="p-3 text-center" @click="selectLabInit(lab)">
        <div class="font-semibold">{{ lab.name }}</div>
        <div class="text-sm text-white-600">RIF: {{ lab.rif }}</div>
      </VaButton>
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

    <!-- Formulario para agregar laboratorio -->
    <div v-if="showAddLabModal" class="bg-white rounded shadow p-6 mb-6">
      <h2 class="font-semibold text-lg mb-4">Agregar Laboratorio</h2>
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
  </div>
</template>
