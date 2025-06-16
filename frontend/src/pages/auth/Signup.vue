<template>
  <div class="register-lab-form bg-white border-4 border-solid border-indigo-600 rounded-md p-6 shadow-lg max-w-2xl mx-auto mt-8">
    <!-- Login Form -->
    <div v-if="!isLoggedIn" class="login-card bg-white p-6 rounded shadow mb-6">
      <h2 class="text-2xl font-semibold mb-4 text-center">Iniciar Sesión</h2>

      <VaInput v-model="loginForm.username" label="Usuario" placeholder="jesusrhivan" />
      <VaInput v-model="loginForm.password" type="password" label="Contraseña" placeholder="Biodesk123$$" />

      <div class="flex justify-center mt-4">
        <VaButton :loading="isLoading" @click="login">Ingresar</VaButton>
      </div>
    </div>

    <!-- Registration Form -->
    <div v-else class="registration-form">
      <h1 class="text-primary font-semibold text-3xl mb-6 text-center">Registro de Laboratorio</h1>

      <!-- Name -->
      <VaInput v-model="formData.name" label="Nombre del laboratorio" placeholder="Laboratorio de Pruebas" />

      <!-- RIF -->
      <VaInput v-model="formData.rif" label="RIF del laboratorio" placeholder="J123456789" class="mt-4" />

      <!-- States Select -->
<div class="mt-4">
  <label class="va-label">Estado</label>
  
  <VaSelect
    v-model="formData.state"
    :options="states"
    track-by="id"
    value-by="id"
    label-by="name"
    text-by="name"
    placeholder="Seleccione un estado"
  />
</div>

<!-- Municipalities Select -->
<div class="mt-4">
  <label class="va-label">Municipio</label>
  <VaSelect
    v-model="formData.municipality"
    :options="municipalities"
    track-by="id"
    text-by="name"
    placeholder="Seleccione un municipio"
    :disabled="!formData.state"
  
  />
</div>

      <!-- Address -->
      <VaInput v-model="formData.address" label="Dirección completa" placeholder="Calle Principal, edificio #123" class="mt-4" />

      <!-- Phone Numbers -->
      <VaInput v-model="formData.phoneNums1" label="Teléfono principal" placeholder="04101234567" class="mt-4" />
      <VaInput v-model="formData.phoneNums2" label="Otro teléfono (opcional)" placeholder="04101234567" class="mt-4" />

      <!-- Actions -->
      <div class="flex justify-between mt-6">
        <VaButton preset="secondary" @click="$router.push({ name: 'signup' })">Atrás</VaButton>
        <VaButton type="submit" @click="submit">Siguiente</VaButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'

const { init } = useToast()
const router = useRouter()

// 🔐 Token state
const token = ref<string | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)

// 🔹 Define types
interface DivisionItem {
  id: string
  name: string
}

// 🔹 Reactive form data
const formData = ref({
  name: '',
  rif: '',
  state: '',
  municipality: '',
  address: '',
  phoneNums1: '',
  phoneNums2: ''
})

// 🔹 Geographic options
const states = ref<DivisionItem[]>([])
const municipalities = ref<DivisionItem[]>([])

// 🔹 Login form
const loginForm = ref({
  username: 'jesusrhivan',
  password: 'Biodesk123$$'
})

// 🔁 Helper to create URL with token
const getURL = (path: string): string => {
  const url = new URL(`https://apisegen.apn.gob.ve/api/v1/${path}`) 
  if (token.value) {
    url.searchParams.append('token', token.value)
  }
  return url.toString()
}

// 🔐 Login function
const login = async () => {
  isLoading.value = true

  try {
    const formDataLogin = new URLSearchParams()
    formDataLogin.append('usuario', loginForm.value.username)
    formDataLogin.append('clave', loginForm.value.password)

    const res = await fetch('https://apisegen.apn.gob.ve/api/v1/login',  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formDataLogin.toString(),
    })

    if (!res.ok) throw new Error('Inicio de sesión fallido')

    const data = await res.json()

    // Extract token
    token.value = data.token
    localStorage.setItem('token', data.token)
    isLoggedIn.value = true

    init({ message: 'Inicio de sesión exitoso', color: 'success' })

    // Load geographic lists
    loadStates()
  } catch (e: any) {
    console.error('Login error:', e.message)
    init({ message: e.message || 'No se pudo iniciar sesión', color: 'danger' })
  } finally {
    isLoading.value = false
  }
}

const loadStates = async () => {
  try {
    const res = await fetch(getURL('listadoEntidad'))
    if (!res.ok) throw new Error('Error fetching states')
    const data = await res.json()

    // ✅ Create fresh plain objects
    states.value = data.data.map((item: any) => ({
      id: item.cod_entidad_ine,
      name: item.entidad_ine
    }))
    
    // ✅ Force reactivity update
    states.value = [...states.value] // force Vue to see changes
  } catch (e: any) {
    init({ message: 'Error: No se pudieron cargar los estados', color: 'danger' })
  }
}

const loadMunicipalities = async (stateId: string) => {
  if (!stateId) return

  try {
    const url = getURL(`listadoMunicipio?codEntidad=${stateId}`)
    console.log('Fetching municipalities from:', url)

    const res = await fetch(url)
    if (!res.ok) throw new Error('Error fetching municipalities')

    const data = await res.json()

    // ✅ Map correctly
    municipalities.value = data.data.map((item: any) => ({
      id: item.cod_municipio_ine,
      name: item.municipio_ine
    }))

    console.log('Municipalities loaded:', municipalities.value)
    
  } catch (e: any) {
    console.error('Municipality loading failed:', e.message)
    init({ message: 'Error: No se pudieron cargar los municipios', color: 'danger' })
  }
}

// 🔍 Watch for state changes
watch(
  () => formData.value.state,
  (newStateId) => {
    if (newStateId) {
      loadMunicipalities(newStateId)
    } else {
      municipalities.value = []
      formData.value.municipality = ''
    }
  }
)

// 🔹 Validation
const validate = (): boolean => {
  if (
    !formData.value.name ||
    !formData.value.rif ||
    !formData.value.state ||
    !formData.value.municipality ||
    !formData.value.phoneNums1
  ) {
    init({ message: 'Por favor, complete todos los campos obligatorios', color: 'warning' })
    return false
  }

  if (!/^[JjGg][0-9]{9}$/.test(formData.value.rif)) {
    init({ message: 'RIF inválido. Debe comenzar con J o G seguido de 9 dígitos.', color: 'danger' })
    return false
  }

  if (!/^\d{11}$/.test(formData.value.phoneNums1)) {
    init({ message: 'Número de teléfono 1 inválido. Formato esperado: 04101234567', color: 'danger' })
    return false
  }

  if (formData.value.phoneNums2 && !/^\d{11}$/.test(formData.value.phoneNums2)) {
    init({ message: 'Número de teléfono 2 inválido. Formato esperado: 04101234567', color: 'danger' })
    return false
  }

  return true
}

// 🧾 Submit handler
const submit = () => {
  if (!validate()) return

  init({ message: 'Laboratorio registrado con éxito', color: 'success' })
  router.push({ name: 'dashboard' })
}
</script>

<style scoped>

.login-card {
  margin-bottom: 2rem;
}
</style>