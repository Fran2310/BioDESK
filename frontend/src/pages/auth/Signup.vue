<template>
  <div class="register-lab-form">
    <h1 class="font-semibold text-4xl mb-4"> Registrar laboratorio </h1>

    <form ref="form" @submit.prevent="submit" class="register-lab">
      <label> Nombre del laboratorio: </label>
      <input type="text" required v-model="formData.name" placeholder="Nombre">

      <label> RIF del laboratorio: </label>
      <input type="text" required v-model="formData.rif" placeholder="J-XXXXXXXXXX">

      <label> Número de teléfono del laboratorio: </label>
      <input type="text" required v-model="formData.phoneNums1" placeholder="0410-1010101">

      <label> Otro número de teléfono (opcional): </label>
      <input type="text" v-model="formData.phoneNums2" placeholder="0410-1010101">

      <div>
        <button type="button" class="go-back"> <RouterLink :to="{ name: 'dashboard' }"> Atras </RouterLink> </button>
        <button type="submit" class="next" @click="submit"> Siguiente </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'

const { validate } = useForm('form')
const { push } = useRouter()
const { init } = useToast()

// Storage for registered data
const formData = reactive({
  name: '',
  rif: '',
  phoneNums1: '',
  phoneNums2: ''
})

const submit = () => {
  if (validate()) {
    init({
      message: "You've successfully signed up",
      color: 'success',
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
    background: #91bb8d;
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
    margin-left: 56%;
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
