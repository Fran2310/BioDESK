<template>
  <AnimateBlock
    ref="animatedBlock"
    @after-leave="() => onAfterLeave(router)"
    enter-duration="2s"
    leave-duration="1s"
  >
    <AuthContentBlock class="relative overflow-hidden">
      <div class="flex items-center gap-1">
        <h1 class="font-semibold text-3xl mb-1 mt-1">Registro</h1>
        <VaDivider vertical color="primary" class="min-h-10" />
        <h3 class="text-2xl mb-1 mt-1">Usuario</h3>
      </div>
      <!-- Transición direccional dinámica -->
      <Transition :name="transitionName" mode="out-in">
        <!--linear-->
        <VaStepper
          :key="step"
          v-model="step"
          :steps="steps"
          class="w-full h-full relative flex flex-col items-center justify-center"
          color="primary"
          controls-hidden
          linear
        >
          <!--STEP 0-->
          <template #step-content-0>
            <div class="w-full flex items-center justify-center">
              <VaForm ref="form0Ref" name="step0" @submit.prevent="">
                <!-- EMAIL -->
                <VaInput
                  v-model="formData.email"
                  autocomplete="email"
                  placeholder="xample@xample.com"
                  :rules="[validator.required, validator.email]"
                  class="w-full"
                  style="min-height: 5rem"
                  label="Email"
                  type="email"
                  color="primary"
                  required-mark
                >
                  <template #prependInner>
                    <VaIcon name="mail_outline" color="secondary" />
                  </template>
                </VaInput>

                <!-- Contraseña -->
                <VaValue v-slot="isPasswordVisible" :default-value="false">
                  <VaInput
                    v-model="formData.password"
                    placeholder="securePass123!"
                    :rules="[
                      validator.required,
                      validator.hasUppercase,
                      validator.hasNumber,
                      validator.minLength,
                    ]"
                    required-mark
                    :type="isPasswordVisible.value ? 'text' : 'password'"
                    color="primary"
                    class="w-full"
                    style="min-height: 4rem"
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
                          isPasswordVisible.value
                            ? 'visibility_off'
                            : 'visibility'
                        "
                        class="cursor-pointer"
                        color="secondary"
                      />
                    </template>
                  </VaInput>
                </VaValue>

                <!-- Repetir contraseña -->
                <VaValue v-slot="isPasswordVisible" :default-value="false">
                  <VaInput
                    v-model="formData.repeatPassword"
                    placeholder="securePass123!"
                    :rules="[
                      samePasswordValidator,
                      validator.required,
                      validator.hasUppercase,
                      validator.hasNumber,
                      validator.minLength,
                    ]"
                    required-mark
                    :type="isPasswordVisible.value ? 'text' : 'password'"
                    color="primary"
                    class="w-full"
                    style="min-height: 4rem"
                    label="Repetir contraseña"
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
                          isPasswordVisible.value
                            ? 'visibility_off'
                            : 'visibility'
                        "
                        class="cursor-pointer"
                        color="secondary"
                      />
                    </template>
                  </VaInput>
                </VaValue>

                <!-- Volver a login -->
                <div class="mt-4">
                  <VaButton
                    class="w-full"
                    icon="arrow_back_ios_new"
                    color="#f2f0eb"
                    border-color="primary"
                    @click="router.push({ name: 'Login' })"
                  >
                    Volver a login
                  </VaButton>
                </div>
              </VaForm>
            </div>
          </template>

          <!--STEP 1-->
          <template #step-content-1>
            <div class="w-full flex items-center justify-center">
              <VaForm ref="form1Ref" name="step1" @submit.prevent="submit">
                <div class="w-full">
                  <!-- Nombre -->
                  <VaInput
                    v-model="formData.name"
                    :rules="[
                      validator.required,
                      validator.noWhitespace,
                      validator.onlyLetters,
                    ]"
                    required-mark
                    type="text"
                    color="primary"
                    class="w-full"
                    style="min-height: 4rem"
                    label="Nombre"
                  >
                    <template #prependInner>
                      <VaIcon name="person" color="secondary" />
                    </template>
                  </VaInput>

                  <!-- Apellido -->
                  <VaInput
                    v-model="formData.lastname"
                    :rules="[validator.required, validator.onlyLetters]"
                    required-mark
                    type="text"
                    color="primary"
                    class="w-full"
                    style="min-height: 4rem"
                    label="Apellido"
                  >
                    <template #prependInner>
                      <VaIcon name="person" color="secondary" />
                    </template>
                  </VaInput>

                  <!-- CEDULA -->
                  <div
                    class="gap-2 flex flex-wrap items-start valuesCenter"
                    style="min-height: 4rem"
                  >
                    <VaSelect
                      label="Cédula"
                      required-mark
                      v-model="formData.ciType"
                      class="w-full lg:w-20"
                      :options="['V', 'E']"
                      color="primary"
                    />
                    <VaInput
                      v-model="formData.ci"
                      label="N°"
                      :rules="[
                        validator.required,
                        validator.onlyNumbers,
                        validator.minLengthCi,
                      ]"
                      placeholder="12345678"
                      type="text"
                      color="primary"
                      class="flex-1"
                    >
                      <template #prependInner>
                        <VaIcon name="assignment_ind" color="secondary" />
                      </template>
                    </VaInput>
                  </div>

                  <!-- Botón de registrarse -->
                  <div class="flex justify-center w-full mt-4">
                    <VaButton
                      gradient
                      class="mt-4 w-full"
                      type="submit"
                      :loading="isLoading"
                    >
                      Registrarse
                    </VaButton>
                  </div>
                </div>
              </VaForm>
            </div>
          </template>
        </VaStepper>
      </Transition>
    </AuthContentBlock>
  </AnimateBlock>
</template>

<script setup lang="ts">
  /* =============================
   * 👉 Imports de componentes y herramientas
   * ============================= */
  import { ref, reactive, watch } from 'vue';
  import router from '@/router';
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import AuthContentBlock from '@/components/AuthContentBlock.vue';
  import { useAnimatedRouteLeave } from '@/composables/useAnimatedRouteLeave';
  import { defineVaStepperSteps, useForm } from 'vuestic-ui';

  /* =============================
   * 👉 Imports de servicios y stores
   * ============================= */
  import { validator } from '@/services/utils.js';
  import { warningFieldsToast } from '../toasts';
  import { initToast } from '@/services/toast';
  import { authApi } from '@/services/api';
  import type { RegisterData } from '@/services/interfaces/auth';
  import { useAuthStore } from '@/stores/authStore';

  /* =============================
   * 🧠 Estado y lógica global
   * ============================= */

  // Acceso al store global de autenticación
  const authStore = useAuthStore();

  // Control del estado de carga durante la solicitud
  const isLoading = ref(false);

  /* =============================
   * 🔢 Stepper y transición animada
   * ============================= */

  // Control del stepper (pasos del formulario)
  const step = ref(0);
  const previousStep = ref(0);
  const transitionName = ref('slide-left');

  // Referencia al bloque animado
  const animatedBlock = ref();
  const { onAfterLeave } = useAnimatedRouteLeave(animatedBlock);

  // Cambia la dirección de la animación al cambiar de paso
  watch(step, (newStep, oldStep) => {
    previousStep.value = oldStep;
    transitionName.value = newStep > oldStep ? 'slide-left' : 'slide-right';
  });

  // Definición de pasos del formulario
  const steps = ref(
    defineVaStepperSteps([
      {
        label: 'Acceso',
        icon: 'lock',
        beforeLeave: (step) => {
          // Valida los campos del paso 0 antes de avanzar
          step.hasError = !step0Form.validate();
        },
      },
      {
        label: 'Datos personales',
        icon: 'person',
        beforeLeave: async (step) => {
          // Valida los campos del paso 1 de forma asíncrona
          step.hasError = !(await step1Form.validateAsync());
        },
      },
    ])
  );

  /* =============================
   * 📋 Referencias y formularios
   * ============================= */

  // Refs de los formularios
  const form0Ref = ref();
  const form1Ref = ref();

  // Inicialización de validadores de Vuestic UI
  const step0Form = useForm(form0Ref);
  const step1Form = useForm(form1Ref);

  /* =============================
   * 🧾 Formulario reactivo
   * ============================= */

  const formData = reactive({
    email: '', // Correo electrónico
    password: '', // Contraseña
    repeatPassword: '', // Repetir contraseña para validar
    name: '', // Nombre del usuario
    lastname: '', // Apellido del usuario
    ci: '', // Cédula de identidad
    ciType: 'V', // Tipo de CI (V/E/P...)
  });

  /* =============================
   * ✅ Validadores personalizados
   * ============================= */

  // Validador que comprueba si las contraseñas coinciden
  const samePasswordValidator = (value: string) => {
    return value === formData.password || 'Las contraseñas no coinciden';
  };

  /* =============================
   * 🚀 Función de envío del formulario
   * ============================= */

  const submit = async () => {
    const validStep1 = await step1Form.validateAsync();

    if (!validStep1) {
      warningFieldsToast();
      return;
    }

    isLoading.value = true;

    try {
      // Formatear los datos para el backend
      const data: RegisterData = {
        ci: `${formData.ciType.toLowerCase()}${formData.ci}`,
        name: formData.name,
        lastName: formData.lastname,
        email: formData.email,
        password: formData.password,
      };

      // Llamada al API de registro
      const response = await authApi.register(data);

      // Guardar token en el store
      authStore.setToken(response.data.access_token);

      // Notificación de éxito
      initToast('Registro', 'Usuario registrado', 'success');

      // Redirección al paso siguiente (registro del laboratorio)
      router.push({ name: 'SignUpLab' });
    } catch (error: any) {
      // Notificación de error
      initToast('Error', error.message, 'danger');
    } finally {
      isLoading.value = false;
    }
  };
</script>

<style scoped>
  .slide-left-enter-active,
  .slide-left-leave-active {
    width: 100%;
    transition: all 0.25s cubic-bezier(0.73, -0.12, 0.16, 1.05);
  }
  .slide-left-enter-from {
    transform: translateX(100%);
    opacity: 0;
  }
  .slide-left-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  .slide-right-enter-active,
  .slide-right-leave-active {
    width: 100%;
    transition: all 0.25s cubic-bezier(0.73, -0.12, 0.16, 1.05);
  }
  .slide-right-enter-from {
    transform: translateX(-100%);
    opacity: 0;
  }
  .slide-right-leave-to {
    transform: translateX(100%);
    opacity: 0;
  }

  ::v-deep(.va-input-wrapper__field::after) {
    border: solid 1px gray;
  }

  ::v-deep(.va-stepper__navigation) {
    display: flex;
    justify-content: start;
  }

  ::v-deep(.va-stepper__divider) {
    min-width: 1rem;
    height: 0.1rem;
  }

  ::v-deep(.va-stepper__step-button) {
    padding: 0.25rem;
  }

  ::v-deep(.va-stepper__step-content) {
    min-width: 30dvw;
    margin-bottom: 1rem;
    margin-top: 1rem;
    min-height: 40dvh;
    max-width: 40dvw;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  .valuesCenter ::v-deep(.va-select-content) {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.75rem;
  }
</style>
