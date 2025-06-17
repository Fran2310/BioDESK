<template>
  <div class="register-lab-form bg-white border-4 border-solid border-indigo-600 rounded-md p-6 shadow-lg max-w-2xl mx-auto mt-8">
    <!-- Registration Form -->
    <div class="registration-form">
      <h1 class="text-primary font-semibold text-3xl mb-6 text-center">Registro de Laboratorio</h1>

      <!-- User Info -->
      <VaInput v-model="formData.ci" label="Cédula de identidad" placeholder="V12345678" />
      <VaInput v-model="formData.name" label="Nombre del usuario" placeholder="John" />
      <VaInput v-model="formData.lastName" label="Apellido del usuario" placeholder="Doe" />
      <VaInput v-model="formData.email" type="email" label="Correo electrónico" placeholder="johndoe@example.com" />
      <VaInput v-model="formData.password" type="password" label="Contraseña" placeholder="securePass123!" />

      <!-- Lab Info -->
      <VaInput v-model="formData.lab.name" label="Nombre del laboratorio" placeholder="Laboratorio de Pruebas" class="mt-4" />
      <VaInput v-model="formData.lab.rif" label="RIF del laboratorio" placeholder="J123456789" class="mt-4" />

      <!-- States Select -->
      <div class="mt-4">
        <label class="va-label">Estado</label>
        <VaSelect
          v-model="formData.lab.state"
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
          v-model="formData.lab.municipality"
          :options="municipalities"
          track-by="id"
          value-by="id"
          text-by="name"
          label-by="name"
          placeholder="Seleccione un municipio"
          :disabled="!formData.lab.state"
        />
      </div>

      <!-- Parroquia Select -->
      <div class="mt-4">
        <label class="va-label">Parroquia</label>
        <VaSelect
          v-model="formData.lab.parish"
          :options="parishes"
          track-by="id"
          value-by="id"
          text-by="name"
          label-by="name"
          placeholder="Seleccione una parroquia"
          :disabled="!formData.lab.municipality"
        />
      </div>

      <VaInput v-model="formData.lab.address" label="Dirección completa" placeholder="Av. Principal #123" class="mt-4" />
      <VaInput v-model="formData.lab.phoneNums[0]" label="Teléfono principal" placeholder="04121234567" class="mt-4" />
      <VaInput v-model="formData.lab.phoneNums[1]" label="Otro teléfono (opcional)" placeholder="02121234567" class="mt-4" />

      <!-- Actions -->
      <div class="flex justify-between mt-6">
        <VaButton preset="secondary" @click="$router.push({ name: 'login' })">Atrás</VaButton>
        <VaButton type="submit" @click="submit" :loading="isLoading">Siguiente</VaButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'

const { init } = useToast()
const router = useRouter()

// 🔐 Auth state
const token = ref<string | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)

// 📦 Form data
const formData = ref({
  ci: '',
  name: '',
  lastName: '',
  email: '',
  password: '',
  lab: {
    name: '',
    rif: '',
    state: null,
    municipality: null,
    parish: null,
    address: '',
    phoneNums: ['', '']
  }
})

// 🌍 Geographic options
const states = ref<{ id: string; name: string }[]>([])
const municipalities = ref<{ id: string; name: string }[]>([])
const parishes = ref<{ id: string; name: string }[]>([])

// 🔐 Login form (hardcoded credentials)
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

// 🔐 Auto-login function
const login = async () => {
  try {
    const formDataLogin = new URLSearchParams()
    formDataLogin.append('usuario', loginForm.value.username)
    formDataLogin.append('clave', loginForm.value.password)
    const res = await fetch('https://apisegen.apn.gob.ve/api/v1/login',  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formDataLogin.toString()
    })
    if (!res.ok) throw new Error('Inicio de sesión fallido')
    const data = await res.json()
    token.value = data.token
    localStorage.setItem('token', data.token)
    isLoggedIn.value = true
    /* init({ message: 'Inicio de sesión exitoso', color: 'success' }) */
    loadStates()
  } catch (e: any) {
    console.error('Login error:', e.message)
    init({ message: e.message || 'No se pudo iniciar sesión', color: 'danger' })
  }
}

// 🏘️ Load geographic data
const loadStates = async () => {
  try {
    const res = await fetch(getURL('listadoEntidad'))
    if (!res.ok) throw new Error('Error fetching states')
    const data = await res.json()
    states.value = data.data.map((item: any) => ({
      id: item.cod_entidad_ine,
      name: item.entidad_ine
    }))
  } catch (e: any) {
    init({ message: 'Error: No se pudieron cargar los estados', color: 'danger' })
  }
}

const loadMunicipalities = async (stateId: string) => {
  if (!stateId) return
  try {
    const url = getURL(`listadoMunicipio?codEntidad=${stateId}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error fetching municipalities')
    const data = await res.json()
    municipalities.value = data.data.map((item: any) => ({
      id: item.cod_municipio_ine,
      name: item.municipio_ine
    }))
  } catch (e: any) {
    init({ message: 'Error: No se pudieron cargar los municipios', color: 'danger' })
  }
}

const loadParishes = async (stateId: string, municipalityId: string) => {
  if (!stateId || !municipalityId) return
  try {
    const url = getURL(`listadoParroquia?codEntidad=${stateId}&codMunicipio=${municipalityId}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error fetching parishes')
    const data = await res.json()
    parishes.value = data.data.map((item: any) => ({
      id: item.cod_parroquia_ine,
      name: item.parroquia_ine
    }))
  } catch (e: any) {
    init({ message: 'Error: No se pudieron cargar las parroquias', color: 'danger' })
  }
}

// Watchers
watch(() => formData.value.lab.state, (newStateId) => {
  if (newStateId) {
    loadMunicipalities(newStateId)
  } else {
    municipalities.value = []
    formData.value.lab.municipality = ''
  }
})

watch(() => formData.value.lab.municipality, (newMunicipalityId) => {
  const stateId = formData.value.lab.state
  if (newMunicipalityId && stateId) {
    loadParishes(stateId, newMunicipalityId)
  } else {
    parishes.value = []
    formData.value.lab.parish = ''
  }
})

// ✅ Validation
const validate = (): boolean => {
  if (
    !formData.value.ci ||
    !formData.value.name ||
    !formData.value.lastName ||
    !formData.value.email ||
    !formData.value.password ||
    !formData.value.lab.name ||
    !formData.value.lab.rif ||
    !formData.value.lab.state ||
    !formData.value.lab.municipality ||
    !formData.value.lab.phoneNums[0]
  ) {
    init({ message: 'Por favor, complete todos los campos obligatorios', color: 'warning' })
    return false
  }

  // Validate RIF format
  if (!/^[JjGg][0-9]{9}$/.test(formData.value.lab.rif)) {
    init({ message: 'RIF inválido. Debe comenzar con J o G seguido de 9 dígitos.', color: 'danger' })
    return false
  }

  // Validate phone number 1 format
  if (!/^\d{11}$/.test(formData.value.lab.phoneNums[0])) {
    init({ message: 'Número de teléfono 1 inválido. Formato esperado: 04101234567', color: 'danger' })
    return false
  }

  return true
}

// Submit handler
const submit = async () => {
  if (!validate()) return

  isLoading.value=true

  try {
    const res = await fetch('https://biodesk.onrender.com/api/auth/register',  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ci: formData.value.ci,
        name: formData.value.name,
        lastName: formData.value.lastName,
        email: formData.value.email,
        password: formData.value.password,
        lab: {
          name: formData.value.lab.name,
          rif: formData.value.lab.rif,
          dir: formData.value.lab.address,
          phoneNums: formData.value.lab.phoneNums.filter(Boolean)
        }
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Error ${res.status}: ${errorText}`)
    }

    const result = await res.json()
    init({ message: 'Registro exitoso', color: 'success' })
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 1000)
  } catch (e: any) {
    init({ message: e.message || 'No se pudo enviar el registro', color: 'danger' })
  }

  finally{isLoading.value=false}
}

onMounted(() => {
  login() // Inicia sesión automáticamente al cargar el componente
})
</script>

<style scoped>
.login-card {
  margin-bottom: 2rem;
}
</style>