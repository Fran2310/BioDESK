<template>
  <div class="p-4 md:p-6">
    <VaCard class="max-w-6xl mx-auto shadow-md">
      <VaCardContent>
        <div class="grid grid-cols-1 md:grid-cols-3">
          <!-- Bloque de datos del paciente -->
          <Transition name="slide-left" mode="out-in">
            <div
              v-if="selectedPatient"
              class="md:col-span-1 bg-primary p-5 text-white rounded shadow-inner"
            >
              <h3 class="text-lg font-semibold text-center">
                Datos del paciente
              </h3>

              <div class="capitalize text-sm flex flex-col h-full gap-2">
                <h4 class="font-semibold text-lg mt-4">Datos personales</h4>
                <div>
                  <strong>CI:</strong> {{ formatCi(selectedPatient.ci) }}
                </div>
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
                <div class="font-semibold text-lg mt-4">Datos de contacto</div>
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
          </Transition>

          <!-- Bloque de solicitud -->
          <div class="md:col-span-2 space-y-6 p-5">
            <!-- Campos de solicitud -->
            <div class="space-y-4">
              <VaSelect
                v-model="form.medicTestCatalogId"
                label="Examen a realizar"
                class="w-full"
                name="medicTestCatalogId"
                :options="medicTestsCatalog"
                :loading="medicTestsCatalogLoading"
                :disabled="medicTestsCatalogLoading"
                text-by="name"
                value-by="id"
              >
                <template #prependInner>
                  <VaIcon name="science" color="secondary" />
                </template>
              </VaSelect>

              <VaSelect
                v-model="form.medicHistoryId"
                label="Buscar paciente"
                class="w-full"
                :options="patients"
                text-by="display"
                value-by="medicHistory.id"
                searchable
                clearable
                :filter="filterPatients"
                :loading="patientsLoading"
                :disabled="patientsLoading"
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
                <template #content>
                  <VaChip class="mr-2" size="small">
                    {{ form.priority }}
                  </VaChip>
                </template>
                <template #prependInner>
                  <VaIcon name="priority_high" color="secondary" />
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
            </div>

            <!-- Botón -->
            <div class="flex justify-end mt-6">
              <VaButton
                color="primary"
                :loading="isLoading"
                @click="submitForm"
              >
                Crear Solicitud
              </VaButton>
            </div>

            <div v-if="error" class="text-danger text-center">{{ error }}</div>
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { medicTestRequestApi } from '@/services/api';
  import { useToast } from 'vuestic-ui';
  import { medicTestCatalogApi } from '@/services/api';
  import { patientApi } from '@/services/api';

  import type { GetExtendQuerys } from '@/services/interfaces/global';
  import { CreateMedicTestRequestData } from '@/services/interfaces/medicTestRequest';
  import { watch } from 'vue';
  import { formatCi } from '@/services/utils';

  import { Priority } from '@/services/types/global.type';

  const form = ref({
    priority: 'MEDIUM' as Priority,
    medicHistoryId: null,
    medicTestCatalogId: null,
    observation: '',
    resultProperties: {
      glucose: '',
      hemoglobin: '',
      notes: '',
    },
  });

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedPatient = ref<any>(null);
  const { init: notify } = useToast();

  const submitForm = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      // Prepare payload (remove empty resultProperties fields)
      const payload: CreateMedicTestRequestData = {
        ...form.value,
        resultProperties: Object.fromEntries(
          Object.entries(form.value.resultProperties).filter(
            ([_, v]) => v !== ''
          )
        ),
      };
      await medicTestRequestApi.createMedicTestRequest(payload);
      notify({ message: 'Request submitted successfully!', color: 'success' });
      // Optionally reset form
      form.value = {
        priority: 'MEDIUM' as Priority,
        medicHistoryId: null,
        medicTestCatalogId: null,
        observation: '',
        resultProperties: { glucose: '', hemoglobin: '', notes: '' },
      };
    } catch (e: any) {
      error.value = e.message || 'Failed to submit request.';
      notify({ message: error.value, color: 'danger' });
    } finally {
      isLoading.value = false;
    }
  };

  const medicTestsCatalog = ref<any[]>([]);
  const medicTestsCatalogLoading = ref(true);

  const patients = ref<any[]>([]);
  const patientsLoading = ref(true);

  const formatPhoneList = (phones: string[]) => phones.join(', ');
  const formatGender = (gender: string) =>
    gender === 'MALE' ? 'Masculino' : gender === 'FEMALE' ? 'Femenino' : 'Otro';

  async function fetchCatalog() {
    const queries: GetExtendQuerys = {
      offset: 0,
      limit: 10,
      includeData: true,
    };
    const response = await medicTestCatalogApi.getMedicTestCatalog(queries);
    medicTestsCatalog.value = Array.isArray(response.data.data)
      ? response.data.data
      : [];
    medicTestsCatalogLoading.value = false;

    console.log(medicTestsCatalog.value);
  }

  async function fetchPatients() {
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
        display: `${p.ci} - ${p.name} ${p.lastName}`,
      }));
      patientsLoading.value = false;
      console.log(patients.value);
    }
  }

  watch(
    () => form.value.medicHistoryId,
    (newVal) => {
      selectedPatient.value = patients.value.find(
        (p) => p.medicHistory?.id === newVal
      );
    }
  );

  onMounted(() => {
    fetchPatients();
    fetchCatalog();
  });

  const filterPatients = (option, query) => {
    const q = query.toLowerCase();
    return (
      option.ci?.toLowerCase().includes(q) ||
      option.name?.toLowerCase().includes(q) ||
      option.lastName?.toLowerCase().includes(q)
    );
  };

  const priorities = [
    { name: 'Alta', priority: 'HIGH' },
    { name: 'Media', priority: 'MEDIUM' },
    { name: 'Baja', priority: 'LOW' },
  ];
</script>

<style scoped>
  ::v-deep(.va-card__content) {
    padding: 0;
  }
  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: all 0.3s ease;
  }
  .slide-left-enter-from {
    opacity: 0;
    transform: translateX(-20px);
  }
  .slide-left-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
</style>
