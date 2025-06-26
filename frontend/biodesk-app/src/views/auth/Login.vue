<template>
  <AnimateBlock
    ref="animatedBlock"
    @after-leave="onAfterLeave"
    enter-duration="2s"
    leave-duration="1s"
  >
    <div
      class="bg-backgroundLightSecondary p-4 py-7 rounded shadow-2xl block w-full max-w-xl border-4 border-secondary mt-12"
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
          <VaButton gradient class="w-full" type="submit" :loading="isLoading">
            Ingresar</VaButton
          >
        </div>
      </VaForm>
    </div>
  </AnimateBlock>
</template>
<script setup lang="ts">
  /**
   * Login.vue
   * Vista de inicio de sesión para BioDESK.
   * - Permite al usuario autenticarse.
   * - Si el usuario marca "Recordarme en este dispositivo", el email se guarda en localStorage para autocompletar en futuros inicios.
   * - Utiliza animaciones de transición según el tamaño de pantalla.
   * - Muestra notificaciones (toast) según el resultado del login.
   * - Anima la retirada del componente en cualquier navegación (router.push, RouterLink, botón atrás, etc).
   */
  import { ref, onMounted, reactive } from 'vue';
  import { useForm } from 'vuestic-ui';
  import { validator } from '@/services/utils.js';
  import { authApi, labApi } from '@/services/api';
  import {
    warningFieldsToast,
    successLoginToast,
    failedLoginToast,
  } from './toasts';
  import { useAuthStore } from '@/stores/authStore';
  import { useLabStore } from '@/stores/labStore';
  import { useRouter, onBeforeRouteLeave } from 'vue-router';
  import AnimateBlock from '@/components/AnimateBlock.vue';

  // Store de autenticación global
  const authStore = useAuthStore();

  // Store de laboratorio global
  const labStore = useLabStore();

  // Router para navegar entre vistas
  const router = useRouter();

  // Estado para mostrar el botón de carga
  const isLoading = ref(false);

  const animatedBlock = ref();

  // Para navegación interna (ej: submit)
  const pendingRoute = ref<null | { name: string }>(null);
  // Para navegación externa (cualquier cambio de ruta)
  const nextRoute = ref<null | (() => void)>(null);

  // Estado reactivo para los datos del formulario
  const formData = reactive({
    email: '',
    password: '',
    keepLoggedIn: false,
  });

  // Validación del formulario
  const { validate } = useForm('form');

  /**
   * Al montar el componente:
   * - Activa la animación de entrada.
   * - Si hay un email guardado en localStorage (por "Recordarme"), lo autocompleta.
   */
  onMounted(() => {
    const biodeskEmail = localStorage.getItem('biodeskEmail');
    if (biodeskEmail) {
      formData.email = biodeskEmail;
      formData.keepLoggedIn = true;
    }
  });

  /**
   * Guard de navegación para animar la retirada en cualquier cambio de ruta.
   * Si se navega fuera del Login (por router.push, RouterLink, botón atrás, etc),
   * primero se anima la salida y luego se permite la navegación.
   */
  onBeforeRouteLeave((to, from, next) => {
    // Si ya está animando la salida, permite la navegación inmediatamente
    if (!animatedBlock.value?.showAnimate) {
      next();
      return;
    }
    nextRoute.value = next;
    animatedBlock.value.hide();
  });

  /**
   * Handler que se ejecuta después de la animación de salida.
   * - Si hay navegación pendiente por cambio de ruta, la realiza.
   * - Si hay navegación interna (ej: submit), navega a la ruta indicada.
   */
  const onAfterLeave = () => {
    if (nextRoute.value) {
      nextRoute.value();
      nextRoute.value = null;
    } else if (pendingRoute.value) {
      router.push(pendingRoute.value);
      pendingRoute.value = null;
    }
  };

  /**
   * Envía el formulario de login.
   * - Valida los campos.
   * - Llama al endpoint de login.
   * - Guarda el token en la store.
   * - Si "Recordarme" está activo, guarda el email en localStorage.
   * - Consulta los laboratorios del usuario y los guarda en el store.
   * - Anima la salida antes de navegar a la selección de laboratorio.
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

      // Consultar laboratorios del usuario
      const labsResponse = await labApi.getUserLabs();
      labStore.setLabs(labsResponse.data.labs);

      // Animar la salida antes de navegar a SelectLab
      pendingRoute.value = { name: 'SelectLab' };
      animatedBlock.value.hide();

      //[NOTA] manejar el caso donde el usuario no tiene laboratorios para que dispare una modal donde le pregunte si quiere crear uno.
    } catch (error: any) {
      failedLoginToast(error.message);
    } finally {
      isLoading.value = false;
    }
  };
</script>
<style scoped>
  /**Formulario */
  ::v-deep(.va-input-wrapper__field::after) {
    border: solid 1px gray;
  }

  ::v-deep(.va-checkbox:not(.va-checkbox--checked)) {
    --va-checkbox-square-border: 3px solid #4a5568; /* gris oscuro (Tailwind gray-700) */
  }
</style>
