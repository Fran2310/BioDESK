<template>
  <!-- Modal para agregar/editar examen -->
  <va-modal v-model="modalVisible" hide-default-actions>
    <template #header>
      <h3 class="text-lg font-bold">{{ exam ? 'Editar Examen' : 'Agregar Examen' }}</h3>
    </template>
    <form @submit.prevent="submit">
      <!-- Nombre del examen -->
      <va-input v-model="form.name" label="Nombre" required class="mb-2" />
      <!-- Descripción -->
      <va-textarea v-model="form.description" label="Descripción" class="mb-2" />
      <div class="mb-2">
        <label class="block mb-1">Propiedades</label>
        <!-- Lista de propiedades clave/valor -->
        <div v-for="(prop, idx) in form.propertiesArr" :key="idx" class="flex gap-2 mb-1">
          <va-input v-model="prop.key" placeholder="Clave" required class="flex-1" />
          <va-input v-model="prop.value" placeholder="Valor" required class="flex-1" />
          <va-button icon="close" color="danger" size="small" @click="removeProperty(idx)" />
        </div>
        <!-- Botón para agregar propiedad -->
        <va-button color="info" size="small" @click="addProperty">Agregar Propiedad</va-button>
      </div>
      <!-- Insumos separados por coma -->
      <va-input v-model="suppliesInput" label="Insumos (separados por coma)" class="mb-2" />
      <!-- Precio -->
      <va-input v-model.number="form.price" label="Precio" type="number" required class="mb-2" />
      <div class="flex gap-2 mt-4">
        <va-button color="success" type="submit">Guardar</va-button>
        <va-button color="secondary" @click="$emit('close')">Cancelar</va-button>
      </div>
    </form>
  </va-modal>
</template>

<script setup lang="ts">
// Composables de Vue
import { ref, watch, onMounted } from 'vue'
// Componentes de Vuestic UI
import { VaInput, VaTextarea, VaButton, VaModal } from 'vuestic-ui'

// Props y emits
const props = defineProps<{ exam?: any }>();
const emit = defineEmits(['close', 'saved'])

// Estado del modal
const modalVisible = ref(true)

// Estado reactivo del formulario
const form = ref({
  name: '',
  description: '',
  propertiesArr: [{ key: '', value: '' }],
  supplies: [] as string[],
  price: 0,
})

// Input para insumos como string separado por coma
const suppliesInput = ref('')

// Actualiza el array de insumos cuando cambia el input
watch(suppliesInput, (val) => {
  const arr = (val || '').split(',').map(s => s.trim()).filter(Boolean)
  form.value.supplies.splice(0, form.value.supplies.length, ...arr)
})

// Agrega una nueva propiedad
const addProperty = () => {
  form.value.propertiesArr.push({ key: '', value: '' })
}
// Elimina una propiedad por índice
const removeProperty = (idx: number) => {
  form.value.propertiesArr.splice(idx, 1)
}

// Llena el formulario si se está editando un examen
const fillForm = () => {
  if (props.exam) {
    form.value.name = props.exam.name
    form.value.description = props.exam.description
    form.value.price = props.exam.price
    form.value.supplies = props.exam.supplies || []
    suppliesInput.value = form.value.supplies.join(', ')
    form.value.propertiesArr = props.exam.properties
      ? Object.entries(props.exam.properties).map(([key, value]) => ({ key, value: String(value) }))
      : [{ key: '', value: '' }]
  } else {
    form.value.name = ''
    form.value.description = ''
    form.value.price = 0
    form.value.supplies = []
    suppliesInput.value = ''
    form.value.propertiesArr = [{ key: '', value: '' }]
  }
}

// Observa cambios en la prop exam para llenar el formulario
watch(() => props.exam, fillForm, { immediate: true })

// Envía el formulario (POST o PUT según corresponda)
const submit = async () => {
  // Convierte las propiedades a objeto
  const propertiesObj: Record<string, string> = {}
  for (const { key, value } of form.value.propertiesArr) {
    if (key) propertiesObj[key] = value
  }
  const payload = {
    name: form.value.name,
    description: form.value.description,
    properties: propertiesObj,
    supplies: form.value.supplies,
    price: form.value.price,
  }
  let url = '/api/medic-test-catalog'
  let method = 'POST'
  if (props.exam && props.exam.id) {
    url += `/${props.exam.id}`
    method = 'PUT'
  }
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  emit('saved')
  modalVisible.value = false
}

// Abre el modal al montar el componente
onMounted(() => { modalVisible.value = true })
</script>
