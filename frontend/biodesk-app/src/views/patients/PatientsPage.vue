<template>
  <div>
    <!-- Tarjeta principal que contiene la barra de búsqueda, el botón de añadir y la tabla de pacientes -->
    <VaCard>
      <VaCardContent>
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <!-- Barra de búsqueda y botón de buscar -->
          <div
            class="flex flex-col md:flex-row gap-2 justify-start items-center"
          >
            <!-- Input para buscar por nombre, apellido o cédula. Al presionar Enter o el botón, se ejecuta la búsqueda -->
            <VaInput v-model="filters.search" placeholder="Nombre, apellido, cédula." @keyup.enter="onSearchByName">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
            <VaButton
              @click="onSearchByName"
              color="primary"
              icon="search"
              class="ml-2"
            >
              Buscar
            </VaButton>
          </div>
          <!-- Botón para abrir el modal de añadir paciente -->
          <VaButton @click="showAddPatientModal">{{
            'Añadir Paciente'
          }}</VaButton>
        </div>
        <!-- Tabla personalizada de pacientes -->
        <CustomPatientsTable
          v-model:sort-by="sorting.sortBy"
          v-model:sorting-order="sorting.sortingOrder"
          :patients="patients"
          :loading="isLoading"
          :pagination="pagination"
          @edit-patient="showEditPatientModal"
          @delete-patient="onPatientDelete"
        />
        <!-- Overlay de carga mientras se obtienen los datos -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10"
        >
          <VaProgressCircle indeterminate size="large" color="primary" />
        </div>
      </VaCardContent>
    </VaCard>
    <!-- Modal para añadir o editar paciente -->
    <VaModal
      v-model="doShowEditPatientModal"
      size="medium"
      blur
      mobile-fullscreen
      close-button
      hide-default-actions
      :before-cancel="beforeEditFormModalClose"
      v-slot="{ cancel, ok }"
    >
      <h1 class="va-h5">
        {{ patientToEdit ? 'Editar Paciente' : 'Añadir Paciente' }}
      </h1>
      <!-- Formulario de paciente, reutilizado para crear o editar -->
      <PatientsForm
        :key="formKey"
        ref="editFormRef"
        :patient="patientToEdit"
        :save-button-label="patientToEdit ? 'Guardar' : 'Añadir'"
        @close="cancel"
        @save="
          (patient) => {
            onPatientSaved(patient);
            ok();
          }
        "
      />
    </VaModal>
  </div>
</template>

<script setup lang="ts">
  // Importaciones de Vue y librerías
  import { ref, onMounted, watch } from 'vue';
  import { useToast, useModal } from 'vuestic-ui';
  import PatientsForm from './widgets/PatientsForm.vue';
  import CustomPatientsTable from './widgets/CustomPatientsTable.vue';
  import { patientApi } from '@/services/api';
  import type { Patient } from '@/services/types/patientType';
  import type { PatientData } from '@/services/interfaces/patient';
  import type { GetExtendQuerys } from '@/services/interfaces/global';

  // Estado de carga y error global
  const isLoading = ref(false);
  const error = ref<any>(null);
  // Filtros de búsqueda
  const filters = ref({ isActive: true, search: '' });
  // Estado de ordenamiento de la tabla
  const sorting = ref<{ sortBy: string; sortingOrder: 'asc' | 'desc' | null }>({
    sortBy: 'fullname',
    sortingOrder: null,
  });
  // Estado de paginación
  const pagination = ref({ page: 1, perPage: 20, total: 0 });
  // Lista de pacientes obtenidos de la API
  const patients = ref<Patient[]>([]);

  /**
   * Obtiene la lista de pacientes desde la API, aplicando filtros, orden y paginación.
   * @param extraQuery Parámetros adicionales para la consulta (búsqueda, etc.)
   */
  const fetchPatients = async (extraQuery: Partial<GetExtendQuerys> = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Construye el query para la API
      const query: GetExtendQuerys = {
        offset: (pagination.value.page - 1) * pagination.value.perPage,
        limit: pagination.value.perPage,
        includeData: true,
        ...extraQuery,
      };
      const response = await patientApi.getPatients(query);
      const responseData = response.data;
      console.log('Patients API response:', responseData);
      patients.value = responseData.data;
      pagination.value.total = responseData.total;
    } catch (e: any) {
      error.value = e;
      console.error('fetchPatients error', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Ejecuta la b��squeda de pacientes por nombre, apellido o cédula.
   */
  const onSearchByName = () => {
    fetchPatients({
      'search-term': filters.value.search,
      'search-fields': ['name', 'lastName', 'ci'],
    });
  };

  // Al montar el componente, carga la lista inicial de pacientes
  onMounted(() => {
    fetchPatients();
  });

  // Observa cambios en el ordenamiento para recargar la lista
  watch([() => sorting.value.sortBy, () => sorting.value.sortingOrder], () => {
    fetchPatients();
  });

  // Observa cambios en la página de la paginación para recargar la lista
  watch(
    () => pagination.value.page,
    () => {
      fetchPatients();
    }
  );

  // Observa cambios en la cantidad de resultados por página para recargar la lista
  watch(
    () => pagination.value.perPage,
    () => {
      pagination.value.page = 1;
      fetchPatients();
    }
  );

  // Estado y referencia para el modal de edición/creación de paciente
  const doShowEditPatientModal = ref(false);
  const patientToEdit = ref<Patient | null>(null);
  const formKey = ref(0); // Se usa para forzar el reinicio del formulario

  /**
   * Muestra el modal para editar un paciente existente.
   * @param patient Paciente a editar
   */
  const showEditPatientModal = (
    patient: PatientData & { id: string | number }
  ) => {
    formKey.value += 1;
    patientToEdit.value = patient;
    doShowEditPatientModal.value = true;
  };

  /**
   * Muestra el modal para añadir un nuevo paciente.
   * Reinicia el formulario si es necesario.
   */
  const showAddPatientModal = () => {
    if (
      editFormRef.value &&
      typeof editFormRef.value.resetForm === 'function'
    ) {
      editFormRef.value.resetForm();
    }
    formKey.value += 1;
    patientToEdit.value = null;
    doShowEditPatientModal.value = true;
  };

  // Inicializa el sistema de notificaciones (toast)
  const { init: notify } = useToast();

  // Observa errores y muestra notificaciones si ocurren
  watch(error, (val) => {
    if (val) {
      notify({
        message: val.message,
        color: 'danger',
      });
    }
  });

  /**
   * Maneja el guardado de un paciente (crear o actualizar).
   * @param patient Paciente a guardar
   */
  const onPatientSaved = async (patient: Patient) => {
    isLoading.value = true;
    try {
      if (patientToEdit.value && patient.id) {
        // Si se está editando, actualiza el paciente
        const { id, ...updateData } = patient;
        await patientApi.updatePatient(id.toString(), updateData);
        notify({
          message: `${patient.name} has been updated`,
          color: 'success',
        });
      } else {
        // Si es nuevo, crea el paciente
        const { id, ...createData } = patient;
        await patientApi.createPatient(createData);
        notify({
          message: `${patient.name} has been created`,
          color: 'success',
        });
      }
      await fetchPatients();
    } catch (e: any) {
      error.value = e;
      console.error('onPatientSaved error', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Maneja la eliminación de un paciente.
   * @param patient Paciente a eliminar
   */
  const onPatientDelete = async (patient: Patient) => {
    isLoading.value = true;
    try {
      await patientApi.deletePatient(patient.id.toString());
      notify({ message: `${patient.name} has been deleted`, color: 'success' });
      await fetchPatients();
    } catch (e: any) {
      error.value = e;
      console.error('onPatientDelete error', e);
    } finally {
      isLoading.value = false;
    }
  };

  // Inicializa el sistema de confirmación de modales
  const { confirm } = useModal();
  const editFormRef = ref();

  /**
   * Antes de cerrar el modal de edición, verifica si hay cambios sin guardar y pide confirmación.
   * @param hide Función para cerrar el modal
   */
  const beforeEditFormModalClose = async (hide: () => unknown) => {
    if (editFormRef.value?.isFormHasUnsavedChanges) {
      const agreed = await confirm({
        maxWidth: '380px',
        message: 'Form has unsaved changes. Are you sure you want to close it?',
        size: 'small',
      });
      if (agreed) {
        hide();
      }
    } else {
      hide();
    }
  };
</script>
