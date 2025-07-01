<template>
  <AnimateBlock
    ref="animatedBlock"
    @after-leave="() => onAfterLeave(router)"
    enter-duration="2s"
    leave-duration="1s"
  >
    <AuthContentBlock class="relative overflow-hidden">
      <h1 class="font-semibold text-3xl mb-4">Cambio de contraseña</h1>
      <!-- Transición direccional dinámica -->
      <Transition :name="transitionName" mode="out-in">
        <VaStepper
          :key="step"
          v-model="step"
          :steps="steps"
          class="w-full h-full min-h-[55vh] min-w-650 relative flex flex-col items-center justify-center"
          color="primary"
          controls-hidden
          linear
        >
          <!--STEP 0-->
          <template #step-content-0>
            <div>
              <p class="text-md w-full mb-2 max-w-sm">
                Enviaremos un <b>código</b> a su correo para autorizar el cambio
                de contraseña
              </p>
              <VaForm ref="form" @submit.prevent="submit">
                <!-- EMAIL -->
                <VaInput
                  v-model="formData.email"
                  autocomplete="email"
                  placeholder="xample@xample.com"
                  :rules="[validator.required, validator.email]"
                  class="mt-2 w-full"
                  style="min-height: 4.5rem"
                  label="Email"
                  type="email"
                  color="primary"
                >
                  <template #prependInner>
                    <VaIcon name="mail_outline" color="secondary" />
                  </template>
                </VaInput>

                <!-- Botón de envío -->
                <div class="flex justify-center mt-12">
                  <VaButton
                    gradient
                    class="w-full"
                    type="submit"
                    :loading="isLoading"
                    icon-right="send"
                  >
                    Enviar código
                  </VaButton>
                </div>

                <!-- Volver a login -->
                <div class="flex justify-center mt-4">
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
            <VaForm ref="form" @submit.prevent="changePassword">
              <div
                class="flex flex-col justify-center items-center w-8xl min-w-password"
              >
                <!-- Código -->
                <VaInput
                  v-model="formData.token"
                  placeholder="XXXXXX"
                  :rules="[validator.required, validator.alphanumericUppercase]"
                  class="w-full"
                  style="min-height: 4.5rem"
                  label="Código"
                  color="primary"
                >
                  <template #prependInner>
                    <VaIcon name="lock" color="secondary" />
                  </template>
                </VaInput>

                <!-- Nueva contraseña -->
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
                    :type="isPasswordVisible.value ? 'text' : 'password'"
                    color="primary"
                    class="w-full"
                    style="min-height: 5.75rem"
                    counter
                    label="Nueva contraseña"
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
                    :type="isPasswordVisible.value ? 'text' : 'password'"
                    color="primary"
                    class="w-full"
                    style="min-height: 5.75rem"
                    counter
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
                <!-- Botón de envío -->
                <div class="flex justify-center w-full">
                  <VaButton
                    gradient
                    class="w-full"
                    type="submit"
                    :loading="isLoading"
                    icon-right="send"
                  >
                    Nueva contraseña
                  </VaButton>
                </div>
              </div>
            </VaForm>
          </template>
        </VaStepper>
      </Transition>
    </AuthContentBlock>
  </AnimateBlock>
</template>

<script setup lang="ts">
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import AuthContentBlock from '@/components/AuthContentBlock.vue';
  import { useAnimatedRouteLeave } from '@/composables/useAnimatedRouteLeave';
  import router from '@/router';
  import { reactive, ref, watch } from 'vue';
  import { validator } from '@/services/utils.js';
  import { warningFieldsToast } from './toasts';
  import { useForm } from 'vuestic-ui';
  import { authApi } from '@/services/api';
  import type {
    ResetPasswordData,
    SendTokenData,
  } from '@/services/interfaces/auth';
  import { initToast } from '@/services/toast';

  const step = ref(0);
  const previousStep = ref(0);
  const transitionName = ref('slide-left'); // animación inicial

  const codeSent = ref(false);
  const steps = [
    { label: 'Enviar código', icon: 'lock' },
    { label: 'Ingresar datos', icon: 'key' },
  ];

  // Watch para controlar la animación y bloquear avance manual
  watch(step, (newStep, oldStep) => {
    // Bloquear avance manual al step 1 si no se ha enviado el código

    if (newStep === 1 && !codeSent.value) {
      step.value = oldStep; // Revertir el cambio
      initToast(
        'Advertencia',
        'Primero debes enviar el código a tu correo.',
        'warning'
      );
      return;
    }

    previousStep.value = oldStep;
    transitionName.value = newStep > oldStep ? 'slide-left' : 'slide-right';
  });
  const animatedBlock = ref();
  const { onAfterLeave } = useAnimatedRouteLeave(animatedBlock);

  // Estado para mostrar el botón de carga
  const isLoading = ref(false);

  const { validate } = useForm('form');

  // Estado reactivo para los datos del formulario
  const formData = reactive({
    email: '',
    token: '',
    password: '',
    repeatPassword: '',
  });

  const samePasswordValidator = (value: string) => {
    return value === formData.password || 'Las contraseñas no coinciden';
  };

  const submit = async () => {
    if (!validate()) {
      // Bloquea el envío si hay errores y muestra un toast de advertencia
      warningFieldsToast();
      return;
    }
    isLoading.value = true;
    try {
      const data: SendTokenData = { email: formData.email };
      const response = await authApi.sendToken(data);

      initToast('Envio de código', response.data.message, 'success');
      codeSent.value = true;
      step.value = 1;
    } catch (error: any) {
      initToast('Error', error.message, 'danger');
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async () => {
    if (!validate()) {
      // Bloquea el envío si hay errores y muestra un toast de advertencia
      warningFieldsToast();
      return;
    }
    isLoading.value = true;
    try {
      const data: ResetPasswordData = {
        email: formData.email,
        token: formData.token,
        newPassword: formData.password,
      };
      const response = await authApi.resetPassword(data);
      initToast('Aviso', response.data.message, 'success');
      router.push({ name: 'Login' });
    } catch (error: any) {
      initToast('Error Token', error.message, 'danger');
    } finally {
      isLoading.value = false;
    }
  };
</script>
<style scoped>
  /**ANIMACION DE STEPPER */
  /** ANIMACIÓN SLIDE A LA IZQUIERDA (avanzo paso) */
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

  /** ANIMACIÓN SLIDE A LA DERECHA (retrocedo paso) */
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

  /**FORMLARIO */
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
    min-width: 29dvw;
    margin-bottom: 1rem;
    margin-top: 1rem;
  }
</style>
