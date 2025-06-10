<template>
  <div class="register-lab-form bg-primary">
    <h1 class="font-semibold text-4xl mb-4 text-center"> Registro de laboratorio </h1>

    <form ref="form" @submit.prevent="submit" class="register-lab">
      <label> Nombre del laboratorio: </label>
      <input type="text" required v-model="formData.name" placeholder="Nombre">

      <label> RIF del laboratorio: </label>
      <input type="text" required v-model="formData.rif" placeholder="J123456789">
      
      <label> Ubicación del laboratorio: </label>
      <select  class="state-select" v-model="formData.state" required>
        <option value="" disabled> Seleccione un estado </option>
        <option v-for="state in states" :key="state.id" :value="state.name">
          {{ state.name }}
        </option>
      </select>
      
      <select class="municipality-select" v-model="formData.municipality" required>
        <option value="" disabled> Seleccione un municipio </option>
        <option v-for="municipality in municipalities" :key="municipality.id" :value="municipality.name">
          {{ municipality.name }}
        </option>
      </select>
<!--
      <select class="parish-select" v-model="formData.parish" required>
        <option value="" disabled> Seleccione una parroquia </option>
        <option v-for="parish in parishes" :key="parish.id" :value="parish.name">
          {{ parish.name }}
        </option>
      </select>

      <select class="community-select" v-model="formData.community" required>
        <option value="" disabled> Seleccione una comunidad </option>
        <option v-for="community in communities" :key="community.id" :value="community.name">
          {{ community.name }}
        </option>
      </select>

      <input type="text" required v-model="formData.address" placeholder="Calle Principal, edificio #123">
-->
      <label> Número de teléfono del laboratorio: </label>
      <input type="text" required v-model="formData.phoneNums1" placeholder="0410-1234567">

      <label> Otro número de teléfono (opcional): </label>
      <input type="text" v-model="formData.phoneNums2" placeholder="0410-1234567">
      <div>
        <button type="button" class="go-back"> <RouterLink :to="{ name: 'dashboard' }"> Atras </RouterLink> </button>
        <button type="submit" class="next" @click="submit"> Siguiente </button>
      </div>
    </form>
  </div>
</template>


<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useToast } from 'vuestic-ui'
import apiDivision from '../../../apiDivision.js'

const { push } = useRouter()
const { init } = useToast()

// Define the structure of the division items
type EntidadItem = { cod_entidad_ine: string; entidad_ine: string }
type MunicipioItem = { cod_municipio_ine: string; municipio_ine: string }
type ParroquiaItem = { cod_parroquia_ine: string; parroquia_ine: string }
type ComunidadItem = { id_comunidad_ine: string; nombre_comunidad: string }
type DivisionItem = { id: string; name: string }

// Reactive arrays for dropdown options (states, municipalities, parishes, communities)
const states = ref<DivisionItem[]>([])
const municipalities = ref<DivisionItem[]>([])
const parishes = ref<DivisionItem[]>([])
const communities = ref<DivisionItem[]>([])

// Reactive form data
const formData = reactive({
  name: '',
  rif: '',
  state: '',
  municipality: '',
  parish: '',
  community: '',
  address: '',
  phoneNums1: '',
  phoneNums2: ''
})

localStorage.setItem('token', 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJVU2ZTQ2RXcUlVSndRc2Y2Q1BzeGExM1VrQXl3MkViSGxHX0haT3IzUWNjIn0.eyJleHAiOjE3NDk2MTA5NDQsImlhdCI6MTc0OTUyODE0NCwianRpIjoiMDRmOGM4ZDQtMjI1NC00N2I5LWJhNGEtODRlZjg2OTYwMTNlIiwiaXNzIjoiaHR0cHM6Ly9zYWEuYXBuLmdvYi52ZS9yZWFsbXMvQVBJU0VHRU4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiZDRkYmIxOTQtMWUwNy00YmE3LWE4MmMtMDg3ZDgwNTYyMzUwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXBpcyIsInNpZCI6IjZmYThlODAwLTAxNGItNGMyNy05NDdlLTQzZDQ3ZDgwMDA1MCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9hcGlzZWdlbi5hcG4uZ29iLnZlIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLWFwaXNlZ2VuIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImFwaS1kcHQiXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiSmVzdXMgUmFtaXJleiIsInByZWZlcnJlZF91c2VybmFtZSI6Implc3VzcmhpdmFuIiwiZ2l2ZW5fbmFtZSI6Ikplc3VzIiwiZmFtaWx5X25hbWUiOiJSYW1pcmV6IiwiZW1haWwiOiJqZXN1c3JoaXZhbkBnbWFpbC5jb20ifQ.JJtfsHKlkLiPQrWTzbZAFXL2lj60ecHEFNgWw6yBN3-GMj7bGdJxragziX5dy01eesIVQF9C4n2q09ZoEikgzdNfpW0a6tZdnl96uuCY3z7zr7XXvSKwZm8OrkzEMsEK-3MVkvw-h6MWffyxyw-Rw6NLqBJhaC3y4rtnamfsXaYoTRu3_rFguDYtwYts0ippYNwEoYKh8ckbHZBmY0GBm3mhfd3G8VjXYydwDATP_T9V4uuCJaXqS9g8MWkRj7xbKLHsLN-caodLYtaQB4pCOH8cQ34IEzxmk8tgc_uAD555u04MYVYR7MzU3AT9KnIFAXuQfarfU6mpk0_JNvN2Bw');

// soli: string [parameter]
// ${soli} [specify division type]
/*
async function fetchData(request: string) {
  try {
    const res = await apiDivision.get(`/listado${request}`) // Endpoint to fetch division data
    states.value = res.data.data.map((item: DivisionItem) => ({
      id: item.cod_entidad_ine,
      name: item.entidad_ine
    }))
  } catch (e) {
    init({ message: 'Error: cargando apartado ${request}', color: 'danger' })
  }
}

onMounted(async () => {
  console.log('onMounted called: fetching geographic lists...')
  fetchData('Entidad')
  fetchData('Municipio')
  fetchData('Parroquia')
  fetchData('Comunidad')

  console.log('States:', states.value)
  console.log(states.value.length)
}) */


// Fetch states, municipalities, parishes, and communities on component mount
onMounted(async () => {
  console.log('onMounted called: fetching geographic lists...')
  try {
    const res = await apiDivision.get(`/listadoEntidad`) // Endpoint to fetch states
    states.value = res.data.data.map((item: EntidadItem) => ({
      id: item.cod_entidad_ine,
      name: item.entidad_ine
    }))
  } catch (e) {
    init({ message: 'Error: cargando entidades', color: 'danger' })
  }
  
  
  try {
    const res = await apiDivision.get(`/listadoMunicipio`) // Endpoint to fetch municipalities
    municipalities.value = res.data.data.map((item: MunicipioItem) => ({
      id: item.cod_municipio_ine,
      name: item.municipio_ine
    }))
  } catch (e) {
    init({ message: 'Error: cargando municipios', color: 'danger' })
  }
  /*
  try {
    const res = await apiDivision.get(`/listadoParroquia`) // Endpoint to fetch parishes
    parishes.value = res.data.data.map((item: ParroquiaItem) => ({
      id: item.cod_parroquia_ine,
      name: item.parroquia_ine
    }))
  } catch (e) {
    init({ message: 'Error: cargando parroquias', color: 'danger' })
  }

  try {
    const res = await apiDivision.get(`/listadoComunidad`) // Endpoint to fetch communities
    communities.value = res.data.data.map((item: ComunidadItem) => ({
      id: item.id_comunidad_ine,
      name: item.nombre_comunidad
    }))
  } catch (e) {
    init({ message: 'Error: cargando comunidades', color: 'danger' })
  } */

  console.log('States:', states.value)
  console.log(states.value.length)
  /* console.log('Municipalities:', municipalities.value)
  console.log(municipalities.value.length)
  console.log('Parishes:', parishes.value)
  console.log(parishes.value.length)
  console.log('Communities:', communities.value)
  console.log(communities.value.length) */
})

// Function to validate form data
const validate = () => {
  if (!formData.name || !formData.rif || !formData.state || !formData.municipality || !formData.parish || !formData.community || !formData.phoneNums1) {
    init({ message: 'Por favor, complete todos los campos obligatorios', color: 'warning' })
    return false
  }

  if (!/^[JjGg][0-9]{9}$/.test(formData.rif)) {
    init({ message: 'RIF inválido. Debe comenzar con J o G seguido de 9 dígitos.', color: 'warning' })
    return false
  }

  if (!/^\d{4}-\d{7}$/.test(formData.phoneNums1)) {
    init({ message: 'Número de teléfono 1 inválido. Formato esperado: 0410-1234567', color: 'warning' })
    return false
  }

  if (formData.phoneNums2 && !/^\d{4}-\d{7}$/.test(formData.phoneNums2)) {
    init({ message: 'Número de teléfono 2 inválido. Formato esperado: 0410-1234567', color: 'warning' })
    return false
  }
  return true
}

// Function to handle form submission
const submit = () => {
  if (validate()) {
    init({
      message: "You've successfully signed up",
      color: 'success'
    })
    push({ name: 'dashboard' })
  }
}
</script>


<style>
  /* Page properties */
  .register-lab-form {
    display: flex;
    flex-direction: column;
    gap: 20px; /* space between elements */
  }

  /* Form properties */
  .register-lab-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
  }

  /* All labels properties */
  label {
    display: block;
    font-weight: bold;
    font-size: medium;
    margin-bottom: 3px;
  }

  /* All input spaces properties */
  input[type="text"] {
    width: 100%;
    margin-bottom: 20px;
    padding: 8px;
    border: 2px solid #000000;
    border-radius: 4px;
    box-sizing: border-box;
  }

  select {
    width: 100%;
    margin-bottom: 20px;
    padding: 8px;
    border: 2px solid #000000;
    border-radius: 4px;
    box-sizing: border-box;
  }

  /* Go back button properties */
  .go-back {
    margin-top: 20px;
    margin-bottom: 10px;
    margin-left: 0px;
    background-color: #3d4e3b;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Next button properties */
  .next {
    margin-top: 20px;
    margin-bottom: 10px;
    float: right;
    margin-left: 0;
    background-color: #3d4e3b;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Button changes color when cursor is over it */
  button:hover {
    background-color: #576e55;
  }
</style>
