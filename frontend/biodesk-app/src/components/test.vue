<template>
  <AnimateBlock
    ref="animatedBlock"
    @after-leave="() => onAfterLeave(router)"
    enter-duration="2s"
    leave-duration="1s"
  >
    <AuthContentBlock>
      <VaStepper
        v-model="step"
        :steps="steps"
        class="mb-6 w-full"
        color="primary"
      >
        <template #step-content-0>
          <h1 class="font-semibold text-4xl mb-4">Cambio de contraseña</h1>
          <p class="text-md w-full max-w-md">
            Enviaremos un <b>código</b> a su correo para autorizar el cambio de
            contraseña, por favor <i><b>copie el código</b></i> e ingréselo con
            su <b>nueva contraseña</b> en los campos a continuación
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
            <div class="flex justify-center mt-4">
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
        </template>
        <template #step-content-1>
          <div class="flex flex-col justify-center min-h-[200px]">
            <h2 class="text-2xl font-semibold mb-2">Ingresar datos</h2>
            <!-- TOKEN -->
            <VaInput
              v-model="formData.token"
              placeholder="XXXXXX"
              :rules="[validator.required]"
              class="mb-5 w-full"
              label="Código"
              counter
              type="email"
              color="primary"
            >
              <template #prependInner>
                <VaIcon name="lock" color="secondary" />
              </template>
            </VaInput>
            <!-- NEW PASSWORD-->
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
                      isPasswordVisible.value ? 'visibility_off' : 'visibility'
                    "
                    class="cursor-pointer"
                    color="secondary"
                  />
                </template>
              </VaInput>
            </VaValue>
            <!-- REPEAT PASSWORD -->
            <VaValue v-slot="isPasswordVisible" :default-value="false">
              <VaInput
                v-model="formData.repeatPassword"
                placeholder="securePass123!"
                :rules="[
                  validator.required,
                  validator.hasUppercase,
                  validator.hasNumber,
                  validator.minLength,
                ]"
                :type="isPasswordVisible.value ? 'text' : 'password'"
                color="primary"
                class="mb-4 w-full"
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
                      isPasswordVisible.value ? 'visibility_off' : 'visibility'
                    "
                    class="cursor-pointer"
                    color="secondary"
                  />
                </template>
              </VaInput>
            </VaValue>
          </div>
        </template>
        <template #step-content-2>
          <div class="flex flex-col items-center justify-center min-h-[200px]">
            <h2 class="text-xl font-semibold mb-2">Nueva contraseña</h2>
            <p>
              Referencia: Aquí irá el formulario para establecer la nueva
              contraseña.
            </p>
            <VaButton class="mt-6" color="primary" @click="step = 0"
              >Volver al inicio</VaButton
            >
          </div>
        </template>
      </VaStepper>
    </AuthContentBlock>
  </AnimateBlock>
</template>
<script setup lang="ts">
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import AuthContentBlock from '@/components/AuthContentBlock.vue';
  import { useAnimatedRouteLeave } from '@/composables/useAnimatedRouteLeave';
  import router from '@/router';
  import { reactive, ref } from 'vue';
  import { validator } from '@/services/utils.js';

  const animatedBlock = ref();
  const { onAfterLeave } = useAnimatedRouteLeave(animatedBlock);

  // Estado para mostrar el botón de carga
  const isLoading = ref(false);
  //stepper config
  const step = ref(0);

  const steps = [
    { label: 'Solicitar código', icon: 'lock' },
    { label: 'Solicitar cambio de contraseña', icon: 'key' },
    { label: 'Aprobado', icon: 'check' },
  ];

  // Estado reactivo para los datos del formulario
  const formData = reactive({
    email: '',
    token: '',
    password: '',
    repeatPassword: '',
  });

  const submit = async () => {
    console.log('enviar formulario');
  };
</script>
<style scoped>
  ::v-deep(.va-input-wrapper__field::after) {
    border: solid 1px gray;
  }
</style>
