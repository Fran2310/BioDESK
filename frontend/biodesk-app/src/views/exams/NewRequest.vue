<template>
  <div class="p-4 md:p-6">
    <VaCard
      class="mx-auto shadow-md relative overflow-hidden"
      :style="{
        'max-width': breakpoints.mdDown
          ? '100%'
          : `${selectedPatient ? '100' : '50'}%`,
      }"
    >
      <VaCardContent class="relative">
        <!-- Bloque de datos del paciente -->
        <div
          v-if="selectedPatient"
          :class="[
            'p-5 rounded shadow-inner transition-transform duration-500',
            breakpoints.smDown
              ? 'relative w-full bg-primary text-white'
              : 'absolute top-0 left-0 h-full w-1/2 bg-primary text-white',
            selectedPatient
              ? breakpoints.smDown
                ? ''
                : 'translate-x-0'
              : breakpoints.smDown
              ? ''
              : '-translate-x-full',
          ]"
        >
          <h3 class="text-lg font-semibold text-center">Datos del paciente</h3>
          <div class="capitalize text-sm flex flex-col h-full gap-1">
            <h4 class="font-semibold text-lg mt-2">Datos personales</h4>

            <div><strong>CI:</strong> {{ formatCi(selectedPatient.ci) }}</div>
            <div>
              <strong>Nombres:</strong> {{ selectedPatient.name }}
              {{ selectedPatient.secondName }}
            </div>
            <div>
              <strong>Apellidos:</strong> {{ selectedPatient.lastName }}
              {{ selectedPatient.secondLastName }}
            </div>
            <div>
              <strong>Género:</strong>
              {{ formatGender(selectedPatient.gender) }}
            </div>
            <div>
              <strong>F. Nacimiento:</strong>
              {{ selectedPatient.birthDate?.slice(0, 10) }}
            </div>
            <div class="font-semibold text-lg mt-2">Datos de contacto</div>
            <div class="lowercase">
              <strong class="capitalize">Correo:</strong>
              {{ selectedPatient.email }}
            </div>
            <div>
              <strong>N° de Teléfonos:</strong>
              {{ formatPhoneList(selectedPatient.phoneNums) }}
            </div>

            <div><strong>Dirección:</strong> {{ selectedPatient.dir }}</div>
          </div>
        </div>

        <!-- Bloque de solicitud -->
        <div
          :class="[
            'relative top-0 right-0 h-full bg-white p-6 space-y-4 transition-transform duration-500',
            breakpoints.smDown
              ? 'w-full'
              : selectedPatient
              ? 'translate-x-full w-1/2'
              : 'translate-x-0',
          ]"
        >
          <VaForm ref="formRef">
            <VaSelect
              v-model="form.medicTestCatalogId"
              label="Examen a realizar"
              class="w-full"
              name="medicTestCatalogId"
              :rules="[validator.required]"
              :options="medicTestsCatalog"
              :loading="medicTestsCatalogLoading"
              :disabled="medicTestsCatalogLoading"
              text-by="name"
              value-by="id"
              searchable
              required-mark
            >
              <template #prependInner>
                <VaIcon name="science" color="secondary" />
              </template>
            </VaSelect>

            <VaSelect
              v-model="form.medicHistoryId"
              label="Buscar paciente"
              class="w-full"
              :rules="[validator.required]"
              :options="patients"
              text-by="display"
              value-by="medicHistory.id"
              searchable
              clearable
              :filter="filterPatients"
              :loading="patientsLoading"
              :disabled="patientsLoading"
              required-mark
            >
              <template #prependInner>
                <VaIcon name="assignment" color="secondary" />
              </template>
            </VaSelect>

            <VaSelect
              v-model="form.priority"
              label="Prioridad"
              class="w-full"
              name="priority"
              :options="priorities"
              text-by="name"
              value-by="priority"
            >
              <template #prependInner>
                <VaIcon name="priority_high" color="secondary" />
              </template>

              <template #content>
                <VaChip
                  :color="getPriorityColor(form.priority)"
                  size="small"
                  class="px-3"
                >
                  {{ getPriorityLabel(form.priority) }}
                </VaChip>
              </template>
            </VaSelect>

            <VaTextarea
              label="Observaciones"
              v-model="form.observation"
              auto-grow
              :rows="3"
              counter
              max-length="500"
              class="w-full"
            />

            <div class="flex justify-end mt-4">
              <VaButton
                color="primary"
                :loading="isLoading"
                @click="submitForm"
              >
                Crear Solicitud
              </VaButton>
            </div>
          </VaForm>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, watchEffect } from 'vue';
  import { useBreakpoint, useToast } from 'vuestic-ui';

  import {
    medicTestRequestApi,
    medicTestCatalogApi,
    patientApi,
  } from '@/services/api';
  import type { GetExtendQuerys } from '@/services/interfaces/global';
  import type { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest';
  import { formatCi, validator } from '@/services/utils';
  import type { Priority } from '@/services/types/global.type';
  import { PatientWithHistoryId } from '@/services/types/patientType';

  const props = defineProps<{ 
    patient?: PatientWithHistoryId 
  }>(); 

  console.log(props.patient);

  const breakpoints = useBreakpoint();

  const form = ref({
    priority: 'MEDIUM' as Priority,
    medicHistoryId: null,
    medicTestCatalogId: null,
    observation: '',
  });
  const formRef = ref();

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedPatient = ref<any>(null);

  const medicTestsCatalog = ref<any[]>([]);
  const medicTestsCatalogLoading = ref(true);

  const patients = ref<any[]>([]);
  const patientsLoading = ref(true);

  const { init: notify } = useToast();

  const priorities = [
    { name: 'Alta', priority: 'HIGH' },
    { name: 'Media', priority: 'MEDIUM' },
    { name: 'Baja', priority: 'LOW' },
  ];

  /**
   * Enviar la solicitud
   */
  const submitForm = async () => {
    if (!form.value.medicTestCatalogId && !form.value.medicHistoryId) {
      notify({
        message: 'Por favor complete los campos obligatorios.',
        color: 'danger',
      });
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const payload: CreateMedicTestRequestData = {
        ...form.value,
        resultProperties: {},
      };
      await medicTestRequestApi.createMedicTestRequest(payload);

      notify({ message: 'Solicitud creada exitosamente.', color: 'success' });

      resetForm();
    } catch (e: any) {
      notify({
        message:
          'Ha ocurrido un error inesperado, por favor intentelo mas tarde',
        color: 'danger',
      });
      console.log(e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Resetear formulario al estado inicial
   */
  const resetForm = () => {
    form.value = {
      priority: 'MEDIUM' as Priority,
      medicHistoryId: null,
      medicTestCatalogId: null,
      observation: '',
    };
    selectedPatient.value = null;

    formRef.value?.resetValidation?.();
  };

  /**
   * Consultar catálogo de exámenes
   */
  const fetchCatalog = async () => {
    medicTestsCatalogLoading.value = true;
    const queries: GetExtendQuerys = {
      offset: 0,
      limit: 10,
      includeData: false,
    };
    const response = await medicTestCatalogApi.getMedicTestCatalog(queries);
    medicTestsCatalog.value = Array.isArray(response.data.data)
      ? response.data.data
      : [];
    medicTestsCatalogLoading.value = false;
  };

  /**
   * Consultar lista de pacientes
   */
  const fetchPatients = async () => {
    patientsLoading.value = true;
    const queries: GetExtendQuerys = {
      offset: 0,
      limit: 10,
      includeData: true,
    };
    const response = await patientApi.getPatients(queries);

    if (Array.isArray(response.data.data)) {
      patients.value = response.data.data.map((p) => ({
        ...p,
        display: `${capitalize(p.name)} ${capitalize(p.lastName)} ${formatCi(
          p.ci
        )}`,
      }));
    }

    patientsLoading.value = false;
  };

  watch(
    () => form.value.medicHistoryId,
    (newId) => {
      selectedPatient.value = patients.value.find(
        (p) => p.medicHistory?.id === newId
      );
    }
  );

  onMounted(() => {
    fetchPatients();
    fetchCatalog();
  });

  watchEffect(() => {
  if (props.patient) {
      selectedPatient.value = props.patient;
      form.value.medicHistoryId = props.patient.medicHistoryId ?? null;
    }
  });


  /**
   * Helpers de formato
   */
  const formatPhoneList = (phones: string[]) => phones.join(', ');
  const formatGender = (gender: string) =>
    gender === 'MALE' ? 'Masculino' : gender === 'FEMALE' ? 'Femenino' : 'Otro';

  /**
   * Filtro de pacientes
   */
  const filterPatients = (option: any, query: string) => {
    const q = query.toLowerCase();
    return (
      option.ci?.toLowerCase().includes(q) ||
      option.name?.toLowerCase().includes(q) ||
      option.lastName?.toLowerCase().includes(q)
    );
  };

  /**
   * Color y etiqueta dinámica para la prioridad
   */
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: Priority): string => {
    const found = priorities.find((p) => p.priority === priority);
    return found ? found.name : '';
  };

  /**
   * Capitaliza la primera letra
   */
  const capitalize = (str?: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
</script>

<style scoped>
  ::v-deep(.va-card__content) {
    padding: 0;
  }

  ::v-deep(.va-select-content) {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 0.75rem;
  }
</style>
