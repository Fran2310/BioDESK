<template>
  <div class="bg-quaternary p-4 py-7 rounded shadow-lg border-4 border-blue-500 block w-full max-w-500">
    <h1 class="font-semibold text-4xl mb-4">Iniciar sesión</h1>

    <!-- <p class="text-base mb-4 leading-5">
      ¿Nuevo en BioDesk?
      <RouterLink :to="{ name: 'signup' }" class="font-semibold text-primary">Regístrese</RouterLink>
    </p> -->


    <VaForm ref="form" @submit.prevent="submit">
      <VaInput
        v-model="formData.email"
        :rules="[validators.required, validators.email]"
        class="mb-5"
        label="Email"
        type="email"
      />
      <VaValue v-slot="isPasswordVisible" :default-value="false">
        <VaInput
          v-model="formData.password"
          :rules="[validators.required]"
          :type="isPasswordVisible.value ? 'text' : 'password'"
          class="mb-4"
          label="Contraseña"
          @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
        >
          <template #appendInner>
            <VaIcon
              :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
              class="cursor-pointer"
              color="secondary"
            />
          </template>
        </VaInput>
      </VaValue>

      <div class="auth-layout__options flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <VaCheckbox v-model="formData.keepLoggedIn" class="mb-2 sm:mb-0 checkbox-square-border-3" label="Recordarme en este dispositivo" />
        <RouterLink :to="{ name: 'recover-password' }" class="mt-2 sm:mt-0 sm:ml-1 font-semibold text-primary">
          ¿Olvidó su contraseña?
        </RouterLink>
      </div>

      <div class="flex justify-center mt-4">
        <VaButton class="w-full" @click="submit" :loading="isLoading"> Ingresar</VaButton>
      </div>
    </VaForm>
  </div>
</template>




<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { validators } from '../../services/utils'
import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()

const { validate } = useForm('form')
const { push } = useRouter()
const { init } = useToast()

const formData = reactive({
  email: '',
  password: '',
  keepLoggedIn: false,
})

const isLoading = ref(false)

const submit = async () => {
  if (!validate()) return

  isLoading.value=true

  try {
    const res = await fetch('https://biodesk.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    })

    if (!res.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await res.json()



    // GUARDAR TOKEN Y LABORATORIOS EN STORE
    authStore.setToken(data.access_token)
    authStore.setLabs(data.labs ? [...data.labs] : [])

    init({
      message: `Login successful! Token: ${data.access_token.substring(0, 20)}...`,
      color: 'success',
      timeout: 5000,
    })

    // NAVEGAR AL DASHBOARD O LABORATORIO ESPECÍFICO

    if (/* data.labs.length === 1 */ 1) {

      // DASHBOARD

      push({ name: 'dashboard' })
    } else {

      // VISTA DE SELECCIÓN DE LABORATORIOS

      push({ name: 'select-lab' })
    }



    init({
      message: `Login successful! Token: ${data.access_token.substring(0, 20)}...`,
      color: 'success',
      timeout: 5000,
    })

  } catch (e: any) {
    console.error(e)
    init({ message: 'Login failed. Check your credentials.', color: 'danger' })
  }

  finally{isLoading.value=false}
}
</script>

<!-- CÓDIGO CSS PARA MODIFICAR EL GROSOR DEL BORDE DE INPUT Y CHECKBOX -->

<style scoped>

::v-deep(.va-checkbox:not(.va-checkbox--checked)) {
  --va-checkbox-square-border: 3px solid #4a5568; /* gris oscuro (Tailwind gray-700) */


}

::v-deep(.va-input-wrapper__field::after) {
  border: solid 1px gray;


}
</style>
