<template>
  <Transition :name="transitionName">
    <div
      v-if="showAnimate"
      class="bg-backgroundLightSecondary p-4 py-7 rounded shadow-2xl block w-full max-w-xl border-4 border-secondary"
    >
      <h1 class="font-semibold text-4xl mb-4">Iniciar Sesión</h1>
      <p class="text-base mb-4 leading-5">
        ¿Nuevo en BioDESK?
        <RouterLink :to="{ name: 'SignUp' }" class="font-semibold text-primary"
          >Registrar</RouterLink
        >
      </p>

      <VaForm ref="form" @submit.prevent="submit">
        <!-- EMAIL -->
        <VaInput
          v-model="formData.email"
          autocomplete="email"
          placeholder="xample@xample.com"
          :rules="[validator.required, validator.email]"
          class="mb-5 w-full"
          label="Email"
          type="email"
          color="primary"
        >
          <template #prependInner>
            <VaIcon name="mail_outline" color="secondary" />
          </template>
        </VaInput>

        <!-- CONTRASEÑA -->
        <!--  validator.hasUppercase,
              validator.hasNumber,
              validator.minLength,      -->
        <VaValue v-slot="isPasswordVisible" :default-value="false">
          <VaInput
            v-model="formData.password"
            placeholder="securePass123!"
            :rules="[validator.required]"
            :type="isPasswordVisible.value ? 'text' : 'password'"
            color="primary"
            class="mb-4 w-full"
            counter
            label="Contraseña"
            @clickAppendInner.stop="
              isPasswordVisible.value = !isPasswordVisible.value
            "
          >
            <template #prependInner>
              <VaIcon name="key" color="secondary" />
            </template>
            <template #appendInner>
              <VaIcon
                :name="
                  isPasswordVisible.value ? 'visibility_off' : 'visibility'
                "
                class="cursor-pointer"
                color="secondary"
              />
            </template>
          </VaInput>
        </VaValue>

        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between"
        >
          <!-- RECORDAR ME -->
          <VaCheckbox
            v-model="formData.keepLoggedIn"
            class="mb-2 sm:mb-0"
            label="Recordarme en este dispositivo"
          />

          <!-- RECUPERAR CONTRASEÑA BUTTON-->
          <RouterLink
            :to="{ name: 'ForgotPassword' }"
            class="mt-2 sm:mt-0 sm:ml-1 font-semibold text-primary"
          >
            ¿Olvidó su contraseña?
          </RouterLink>
        </div>

        <!-- INGRESAR BUTTON -->
        <div class="flex justify-center mt-4">
          <VaButton class="w-full" @click="submit" :loading="isLoading">
            Ingresar</VaButton
          >
        </div>
      </VaForm>
    </div>
  </Transition>
</template>
<script setup lang="ts">
  /**
   * Login.vue
   * Vista de inicio de sesión para BioDESK.
   * - Permite al usuario autenticarse.
   * - Si el usuario marca "Recordarme en este dispositivo", el email se guarda en localStorage para autocompletar en futuros inicios.
   * - Utiliza animaciones de transición según el tamaño de pantalla.
   * - Muestra notificaciones (toast) según el resultado del login.
   */
  import { ref, onMounted, reactive, computed } from 'vue';
  import { useBreakpoint, useForm } from 'vuestic-ui';
  import { validator } from '@/services/utils.js';
  import { authApi } from '@/services/api';
  import {
    warningFieldsToast,
    successLoginToast,
    failedLoginToast,
  } from './toasts';
  import { useAuthStore } from '@/stores/authStore';

  // Store de autenticación global
  const authStore = useAuthStore();

  // Estado para animar la entrada del formulario
  const showAnimate = ref(false);

  // Estado reactivo para los datos del formulario
  const formData = reactive({
    email: '',
    password: '',
    keepLoggedIn: false,
  });

  // Estado para mostrar el botón de carga
  const isLoading = ref(false);

  // Validación del formulario
  const { validate } = useForm('form');

  // Breakpoint para animaciones responsivas
  const breakpoint = useBreakpoint();
  const transitionName = computed(() =>
    breakpoint.lgUp ? 'slide-fade-x' : 'slide-fade-y'
  );

  /**
   * Al montar el componente:
   * - Activa la animación de entrada.
   * - Si hay un email guardado en localStorage (por "Recordarme"), lo autocompleta.
   */
  onMounted(() => {
    showAnimate.value = true;
    const biodeskEmail = localStorage.getItem('biodeskEmail');
    if (biodeskEmail) {
      formData.email = biodeskEmail;
      formData.keepLoggedIn = true;
    }
  });

  /**
   * Envía el formulario de login.
   * - Valida los campos.
   * - Llama al endpoint de login.
   * - Guarda el token en la store.
   * - Si "Recordarme" está activo, guarda el email en localStorage.
   * - Muestra toasts según el resultado.
   */
  const submit = async () => {
    if (!validate()) {
      // Bloquea el envío si hay errores y muestra un toast de advertencia
      warningFieldsToast();
      return;
    }

    isLoading.value = true;

    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      successLoginToast();
      authStore.setToken(response.data.access_token);

      // Guardar email si keepLoggedIn está activo
      if (formData.keepLoggedIn) {
        localStorage.setItem('biodeskEmail', formData.email);
      } else {
        localStorage.removeItem('biodeskEmail');
      }
    } catch (error: any) {
      failedLoginToast(error.message);
    } finally {
      isLoading.value = false;
    }
  };
</script>
<style scoped>
  /** Animaciones
    cubic-bezier(0.23, 1, 0.32, 1)
    ease-in-out
    cubic-bezier(0.4, 0, 0.2, 1)
    cubic-bezier(0.22, 1, 0.36, 1)
    */
  /**PARA: Transition */
  .slide-fade-x-enter-active,
  .slide-fade-x-leave-active {
    transition: all 2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .slide-fade-x-enter-from,
  .slide-fade-x-leave-to {
    opacity: 0;
    transform: translateX(200px);
    filter: blur(1px);
  }
  .slide-fade-x-enter-to,
  .slide-fade-x-leave-from {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }

  .slide-fade-y-enter-active,
  .slide-fade-y-leave-active {
    transition: all 2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .slide-fade-y-enter-from,
  .slide-fade-y-leave-to {
    opacity: 0;
    transform: translateY(200px);
    filter: blur(1px);
  }
  .slide-fade-y-enter-to,
  .slide-fade-y-leave-from {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }

  /**Formulario */
  ::v-deep(.va-input-wrapper__field::after) {
    border: solid 1px gray;
  }

  ::v-deep(.va-checkbox:not(.va-checkbox--checked)) {
    --va-checkbox-square-border: 3px solid #4a5568; /* gris oscuro (Tailwind gray-700) */
  }
</style>
