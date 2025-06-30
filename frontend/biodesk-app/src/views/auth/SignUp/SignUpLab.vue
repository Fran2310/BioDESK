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
        <h3 class="text-2xl mb-1 mt-1">Laboratorio</h3>
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
              <VaForm
                ref="form0Ref"
                name="step0"
                @submit.prevent=""
                class="w-full flex flex-col"
              >
                <!-- Nombre -->
                <VaInput
                  v-model="formData.name"
                  :rules="[validator.required]"
                  required-mark
                  type="text"
                  color="primary"
                  class="w-full"
                  style="min-height: 5rem"
                  label="Nombre"
                >
                  <template #prependInner>
                    <VaIcon name="science" color="secondary" />
                  </template>
                </VaInput>

                <!-- RIF -->
                <div class="gap-2 flex flex-wrap items-start valuesCenter">
                  <VaSelect
                    label="RIF"
                    required-mark
                    v-model="formData.rifType"
                    :options="['V', 'J', 'G']"
                    class="w-full lg:w-20"
                    color="primary"
                  />
                  <VaInput
                    v-model="formData.rif"
                    label="N° RIF"
                    required-mark
                    :rules="[
                      validator.required,
                      validator.onlyNumbers,
                      validator.minLengthCi,
                    ]"
                    placeholder="123456789"
                    type="text"
                    color="primary"
                    class="flex-1"
                    style="min-height: 5rem"
                  >
                  </VaInput>
                </div>

                <!-- TELEFONOS -->
                <div class="gap-2 flex flex-wrap items-start mb-2 valuesCenter">
                  <VaSelect
                    label="Cod área"
                    v-model="phoneInput.areaCode"
                    :options="areaCodes"
                    class="w-full lg:w-20"
                    color="primary"
                    searchable
                    :rules="[phoneAreaCodeValidator]"
                  />
                  <VaInput
                    v-model="phoneInput.number"
                    label="N° Teléfono"
                    :rules="[phoneNumberValidator]"
                    placeholder="1234567"
                    type="tel"
                    color="primary"
                    class="flex-1"
                    @keyup.enter="addPhone"
                  >
                    <template #prependInner>
                      <VaIcon name="call" color="secondary" />
                    </template>
                    <template #appendInner>
                      <VaButton
                        icon="add"
                        color="primary"
                        @click="addPhone"
                        @keyup.enter="addPhone"
                        :disabled="!canAddPhone"
                        aria-label="Agregar teléfono"
                      />
                    </template>
                  </VaInput>
                </div>
                <!-- Tags de teléfonos añadidos -->
                <div class="flex flex-wrap gap-1" style="min-height: 2rem">
                  <VaChip
                    v-for="(phone, idx) in formData.phoneNums.slice(0, 2)"
                    :key="phone"
                    class="items-center"
                    color="primary"
                  >
                    <VaIcon name="call" class="mr-1" />
                    {{ phone }}
                    <VaButton
                      icon="close"
                      size="small"
                      color="primary"
                      class="ml-2"
                      round
                      @click="removePhone(idx)"
                      aria-label="Eliminar teléfono"
                      flat
                    />
                  </VaChip>

                  <!-- Botón para mostrar el menú si hay más de 3 teléfonos -->
                  <VaMenu
                    v-if="formData.phoneNums.length > 2"
                    v-model="showPhonesMenu"
                    :close-on-content-click="false"
                    placement="bottom"
                  >
                    <template #anchor>
                      <VaButton
                        icon="add"
                        color="primary"
                        size="small"
                        class="w-12"
                        aria-label="Ver más teléfonos"
                        round
                      >
                        {{ formData.phoneNums.length - 2 }}
                      </VaButton>
                    </template>
                    <div class="flex flex-col gap-1 p-2 min-w-[180px]">
                      <VaChip
                        v-for="(phone, idx) in formData.phoneNums.slice(2)"
                        :key="phone"
                        class="items-center"
                        color="primary"
                      >
                        <VaIcon name="call" class="mr-2" />
                        {{ phone }}
                        <VaButton
                          icon="close"
                          size="small"
                          color="primary"
                          class="ml-2"
                          round
                          @click="removePhone(idx + 2)"
                          aria-label="Eliminar teléfono"
                          flat
                        />
                      </VaChip>
                    </div>
                  </VaMenu>
                </div>
              </VaForm>
            </div>
          </template>

          <!--STEP 1-->
          <template #step-content-1>
            <div class="w-full flex items-center justify-center">
              <VaForm ref="form1Ref" name="step1" @submit.prevent="submit">
                <div class="w-full">
                  <!-- Estado y Municipio -->
                  <div
                    class="grid gap-1"
                    :class="{
                      'grid-cols-1': !isDesktop,
                      'grid-cols-2': isDesktop,
                    }"
                    style="min-height: 5rem"
                  >
                    <!-- Estado (Entidad) -->
                    <VaSelect
                      v-model="dirInput.entity"
                      :options="entityOptions"
                      track-by="value"
                      text-by="label"
                      label="Estado"
                      required-mark
                      :rules="[validator.required]"
                      color="primary"
                      class=""
                      searchable
                    >
                      <template #prependInner>
                        <VaIcon name="location_on" color="secondary" />
                      </template>
                    </VaSelect>

                    <!-- Municipio -->
                    <VaSelect
                      v-model="dirInput.municipality"
                      :options="municipalityOptions"
                      track-by="value"
                      text-by="label"
                      label="Municipio"
                      required-mark
                      :rules="[validator.required]"
                      color="primary"
                      class="flex-1"
                      searchable
                    >
                      <template #prependInner>
                        <VaIcon name="domain" color="secondary" />
                      </template>
                    </VaSelect>
                  </div>

                  <!-- Parroquia y Comunidad -->
                  <div
                    class="grid gap-1"
                    :class="{
                      'grid-cols-1': !isDesktop,
                      'grid-cols-2': isDesktop,
                    }"
                  >
                    <!-- Parroquia -->
                    <VaSelect
                      v-model="dirInput.parish"
                      :options="parishOptions"
                      track-by="value"
                      text-by="label"
                      label="Parroquia"
                      :rules="[]"
                      color="primary"
                      class="flex-1"
                      searchable
                    >
                      <template #prependInner>
                        <VaIcon name="church" color="secondary" />
                      </template>
                    </VaSelect>

                    <!-- Comunidad -->
                    <VaSelect
                      v-model="dirInput.community"
                      :options="communityOptions"
                      track-by="value"
                      text-by="label"
                      label="Comunidad"
                      :rules="[]"
                      color="primary"
                      class="flex-1"
                      searchable
                    >
                      <template #prependInner>
                        <VaIcon name="groups" color="secondary" />
                      </template>
                    </VaSelect>
                  </div>

                  <!-- Resto de direccion -->
                  <VaTextarea
                    v-model="dirInput.restDir"
                    label=" "
                    required-mark
                    :rules="[validator.required]"
                    placeholder="Calle, avenida, edificio, piso..."
                    color="primary"
                    class="w-full"
                    style="min-height: 7rem"
                    :min-rows="1"
                    :max-rows="2"
                    :resize="false"
                  >
                    <template #prependInner>
                      <VaIcon name="home" color="secondary" />
                    </template>
                  </VaTextarea>

                  <!-- Botón de registrarse -->
                  <div class="flex justify-center w-full mt-4">
                    <VaButton
                      gradient
                      class="w-full"
                      type="submit"
                      :loading="isLoading"
                    >
                      Registrar laboratorio
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
  import AnimateBlock from '@/components/AnimateBlock.vue';
  import AuthContentBlock from '@/components/AuthContentBlock.vue';
  import { useAnimatedRouteLeave } from '@/composables/useAnimatedRouteLeave';
  import router from '@/router';
  import { onMounted, reactive, ref, watch } from 'vue';
  import { validator } from '@/services/utils.js';
  // import { warningFieldsToast } from '../toasts';
  import { initToast } from '@/services/toast';
  import { defineVaStepperSteps, useBreakpoint, useForm } from 'vuestic-ui';
  import type { RegisterLabData, LabData } from '@/services/interfaces/lab';
  import { computed } from 'vue';
  import {
    loginApiDPT,
    fetchEntidades,
    fetchMunicipios,
    fetchParroquias,
    fetchComunidades,
  } from '@/services/apiDPT';
  import { warningFieldsToast } from '../toasts';
  import type { SelectOptionApiDPT } from '@/services/types/global.type';
  import { labApi } from '@/services/api';
  import { useLabStore } from '@/stores/labStore';

  const breakpoint = useBreakpoint();
  const isDesktop = computed(() => breakpoint.mdUp);

  const areaCodes = ['0414 ', '0424', '0416', '0426', '0412'];
  const labStore = useLabStore();

  const step = ref(0);
  const previousStep = ref(0);
  const transitionName = ref('slide-left');

  const form0Ref = ref();
  const form1Ref = ref();
  const step0Form = useForm(form0Ref);
  const step1Form = useForm(form1Ref);
  const isLoading = ref(false);
  const showPhonesMenu = ref(false);

  const steps = ref(
    defineVaStepperSteps([
      {
        label: 'Datos',
        icon: 'science',
        beforeLeave: (step) => {
          step.hasError = !step0Form.validate();
        },
      },
      {
        label: 'Dirección',
        icon: 'map',
        beforeLeave: async (step) => {
          step.hasError = !(await step1Form.validateAsync());
        },
      },
    ])
  );

  const animatedBlock = ref();
  const { onAfterLeave } = useAnimatedRouteLeave(animatedBlock);

  watch(step, (newStep, oldStep) => {
    previousStep.value = oldStep;
    transitionName.value = newStep > oldStep ? 'slide-left' : 'slide-right';
  });

  //  estado para el input de teléfono temporal
  const phoneInput = reactive({
    areaCode: '0412',
    number: '',
  });

  // Computed para habilitar el botón de agregar
  const canAddPhone = computed(() => {
    return (
      phoneInput.areaCode &&
      phoneInput.number &&
      validator.onlyNumbers(phoneInput.number) === true &&
      validator.onlyLength7to8(phoneInput.number) === true &&
      !formData.phoneNums.includes(
        `${phoneInput.areaCode}-${phoneInput.number}`
      )
    );
  });

  // Función para agregar teléfono
  function addPhone() {
    if (!canAddPhone.value) return;
    const fullPhone = `${phoneInput.areaCode}-${phoneInput.number}`;
    formData.phoneNums.push(fullPhone);
    phoneInput.number = '';
    // Mantener el código de área seleccionado, solo limpiar el número
  }

  // Función para eliminar teléfono
  function removePhone(idx: number) {
    formData.phoneNums.splice(idx, 1);
  }

  const formData = reactive({
    name: '',
    rif: '',
    rifType: 'J',
    dir: '',
    areaCode: '',
    phoneNums: [] as string[],
  });

  const credentialsApiDPT = ref({
    username: import.meta.env.VITE_CREDENTIAL_APISEGEN_USER,
    password: import.meta.env.VITE_CREDENTIAL_APISEGEN_PW,
  });

  // Opciones para los selects
  const entityOptions = ref<SelectOptionApiDPT[]>([]);
  const municipalityOptions = ref<SelectOptionApiDPT[]>([]);
  const parishOptions = ref<SelectOptionApiDPT[]>([]);
  const communityOptions = ref<SelectOptionApiDPT[]>([]);

  const dirInput = reactive<{
    entity: SelectOptionApiDPT | null;
    municipality: SelectOptionApiDPT | null;
    parish: SelectOptionApiDPT | null;
    community: SelectOptionApiDPT | null;
    restDir: string;
  }>({
    entity: null,
    municipality: null,
    parish: null,
    community: null,
    restDir: '',
  });

  // 🔁 Cargar municipios al cambiar la entidad
  watch(
    () => dirInput.entity,
    async (newVal) => {
      dirInput.municipality = null;
      dirInput.parish = null;
      dirInput.community = null;
      municipalityOptions.value = [];
      parishOptions.value = [];
      communityOptions.value = [];
      if (newVal) {
        municipalityOptions.value = await fetchMunicipios(newVal.value);
      }
    }
  );

  // 🔁 Cargar parroquias al cambiar el municipio
  watch(
    () => dirInput.municipality,
    async (newVal) => {
      dirInput.parish = null;
      dirInput.community = null;
      parishOptions.value = [];
      communityOptions.value = [];
      if (newVal && dirInput.entity) {
        parishOptions.value = await fetchParroquias(
          dirInput.entity.value,
          newVal.value
        );
      }
    }
  );

  // 🔁 Cargar comunidades al cambiar parroquia
  watch(
    () => dirInput.parish,
    async (newVal) => {
      dirInput.community = null;
      communityOptions.value = [];

      if (newVal && dirInput.entity && dirInput.municipality) {
        communityOptions.value = await fetchComunidades(
          dirInput.entity.value,
          dirInput.municipality.value,
          newVal.value
        );
      }
    }
  );

  // Validadores condicionales para teléfonos
  const phoneAreaCodeValidator = (v: any) => {
    // Si ya hay teléfonos añadidos, no es obligatorio
    if (formData.phoneNums.length > 0) return true;
    // Si no hay teléfonos, es obligatorio
    return validator.required(v);
  };

  const phoneNumberValidator = (v: string) => {
    // Si ya hay teléfonos añadidos, no es obligatorio
    if (formData.phoneNums.length > 0) return true;
    // Si no hay teléfonos, debe cumplir todas las reglas
    return (
      validator.required(v) === true &&
      validator.onlyNumbers(v) === true &&
      validator.onlyLength7to8(v) === true
    );
  };

  function capitalizeWords(str: string) {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function formatDir(input: typeof dirInput): string {
    const parts = [
      input.entity?.label,
      input.municipality?.label,
      input.parish?.label,
      input.community?.label,
      input.restDir,
    ].filter(Boolean);

    return capitalizeWords(parts.join(', '));
  }

  const submit = async () => {
    const validStep1 = await step1Form.validateAsync();
    if (!validStep1) {
      warningFieldsToast();
      return;
    }
    isLoading.value = true;
    try {
      // --- Formatear el RIF ---
      const formattedRif = `${formData.rifType.toLowerCase()}${formData.rif}`;
      const formattedDir = formatDir(dirInput);
      const data: RegisterLabData = {
        name: formData.name,
        rif: formattedRif,
        dir: formattedDir,
        phoneNums: formData.phoneNums,
      };
      const response = await labApi.createLab(data);
      console.log('data: ', data);
      console.log('response: ', response);
      const currentLab: LabData = {
        ...response.data,
        logoPath: null, // Añadimos el campo logoPath
      };
      labStore.setCurrentLab(currentLab);
      initToast('Registro', 'Laboratorio registrado', 'success');
      router.push({ name: 'LoadScreen' });
    } catch (error: any) {
      initToast('Error', error.message, 'danger');
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(async () => {
    try {
      await loginApiDPT(
        credentialsApiDPT.value.username,
        credentialsApiDPT.value.password
      );
      entityOptions.value = await fetchEntidades();
    } catch (e: any) {
      initToast('Error', 'No se pudo conectar con el sistema DPT', 'danger');
    }
  });
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

  /**FORMULARIO  */
  ::v-deep(.va-input-wrapper__field::after) {
    border: solid 1px gray;
  }

  ::v-deep(.va-input-wrapper__field) {
    padding-right: 0;
  }

  ::v-deep(.va-stepper__navigation) {
    display: flex;
    justify-content: start;
    margin-top: 1rem;
  }

  ::v-deep(.va-stepper__divider) {
    min-width: 1rem;
    height: 0.1rem;
  }

  ::v-deep(.va-stepper__step-button) {
    padding: 0.25rem;
  }

  ::v-deep(.va-stepper__step-content) {
    min-width: 35dvw;
    margin-bottom: 1rem;
    margin-top: 1rem;
    min-height: 40dvh;
    max-width: 40dvw;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }

  ::v-deep(.va-chip__content) {
    padding-right: 0;
  }

  .valuesCenter ::v-deep(.va-select-content) {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.75rem;
  }
</style>
