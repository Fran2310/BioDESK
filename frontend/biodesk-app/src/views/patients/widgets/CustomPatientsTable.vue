<script setup lang="ts">
  // Importaciones de utilidades y tipos de Vuestic UI y Vue
  import { defineVaDataTableColumns, useModal } from 'vuestic-ui';
  import type { DataTableSortingOrder } from 'vuestic-ui';
  import type { Patient } from '@/services/types/patientType';
  import type { PropType } from 'vue';
  import { computed, toRef, ref } from 'vue';
  import { useVModel } from '@vueuse/core';

  // ---------------------- FUNCIONES AUXILIARES ----------------------

  /**
   * Calcula la edad a partir de la fecha de nacimiento en formato YYYY-MM-DD.
   * Si la fecha es inválida, retorna '-'.
   */
  const calculateAge = (birthDate: string): number | string => {
    if (!birthDate) return '-';
    // Try to match YYYY-MM-DD
    const isoMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!isoMatch) return '-';
    const [_, year, month, day] = isoMatch;
    const birth = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // ---------------------- ESTADO DE MODAL Y PACIENTE SELECCIONADO ----------------------

  // Paciente seleccionado para mostrar detalles
  const selectedPatient = ref<Patient | null>(null);
  // Estado de visibilidad del modal de detalles
  const isDetailsModalOpen = ref(false);

  /**
   * Maneja el click en una fila de la tabla, mostrando el modal de detalles del paciente.
   */
  const handleRowClick = (event: { item: Patient }) => {
    selectedPatient.value = event.item;
    isDetailsModalOpen.value = true;
  };

  // ---------------------- DEFINICIÓN DE COLUMNAS DE LA TABLA ----------------------

  // Columnas de la tabla de pacientes, con sus llaves y opciones de ordenamiento
  const columns = defineVaDataTableColumns([
    { label: 'Nombre', key: 'name', sortable: true },
    { label: 'Apellido', key: 'lastName', sortable: true },
    { label: 'Segundo Nombre', key: 'secondName', sortable: true },
    {
      label: 'Segundo Apellido',
      key: 'secondLastName',
      sortable: true,
    },
    { label: 'CI', key: 'ci', sortable: true },
    { label: 'Fecha de Nacimiento', key: 'birthDate', sortable: true },
    { label: 'Dirección', key: 'dir', sortable: true },
    // { label: t('patients.phoneNums'), key: 'phoneNums' }
    // { label: t('patients.active'), key: 'active' },
    { label: 'Acciones', key: 'actions', align: 'right' },
  ]);

  // ---------------------- PROPIEDADES Y EMISIONES ----------------------

  // Props recibidas del componente padre
  const props = defineProps({
    patients: {
      type: Array as PropType<Patient[]>,
      required: true,
    },
    loading: { type: Boolean, default: false },
    pagination: {
      type: Object as PropType<{
        page: number;
        perPage: number;
        total: number;
      }>,
      required: true,
    },
    sortBy: { type: String, required: true },
    sortingOrder: {
      type: String as PropType<DataTableSortingOrder | undefined>,
      default: undefined,
    },
  });

  // Definición de los eventos emitidos por la tabla
  const emit = defineEmits<{
    (event: 'edit-patient', patient: Patient): void;
    (event: 'delete-patient', patient: Patient): void;
    (event: 'update:sortBy', sortBy: string): void;
    (
      event: 'update:sortingOrder',
      sortingOrder: DataTableSortingOrder | undefined
    ): void;
  }>();

  // Referencias reactivas para los props y el estado de ordenamiento
  const patients = toRef(props, 'patients');
  const sortByVModel = useVModel(props, 'sortBy', emit);
  const sortingOrderVModel = useVModel(props, 'sortingOrder', emit);

  // Cálculo del total de páginas para la paginación
  const totalPages = computed(() =>
    Math.ceil(props.pagination.total / props.pagination.perPage)
  );

  // ---------------------- ACCIONES DE LA TABLA ----------------------

  // Modal de confirmación para eliminar paciente
  const { confirm } = useModal();

  /**
   * Solicita confirmación y emite el evento para eliminar un paciente.
   */
  const onPatientDelete = async (patient: Patient) => {
    const agreed = await confirm({
      title: 'Delete user',
      message: `Are you sure you want to delete ${patient.name} ${patient.lastName}?`,
      okText: 'Delete',
      cancelText: 'Cancel',
      size: 'small',
      maxWidth: '380px',
    });

    if (agreed) {
      emit('delete-patient', patient);
    }
  };

  /**
   * Formatea y muestra los teléfonos de un paciente como string separado por comas.
   */
  const displayPhones = (phones: string[]) => {
    return phones.filter(Boolean).join(', ');
  };

  /**
   * Formatea la fecha a formato local legible.
   */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // ---------------------- ACCIONES DE NAVEGACIÓN ----------------------

  import { useRouter } from 'vue-router';
  import { formatCi } from '@/services/utils';
  const router = useRouter();

  /**
   * Navega a la vista de exámenes del paciente seleccionado.
   */
  function onViewExams(patient) {
    if (patient) {
      router.push({ name: 'Exams', params: { medicHistoryId: patient.id } });
    }
  }
  /**
   * Acción placeholder para añadir examen (puede ser implementada según necesidad).
   */
  function onAddExam(patient) {
    // Implementar navegación o modal según necesidad
    router.push({ name: 'NewRequest', params: { patientId: patient.id } })
    console.log('Add Exam for patient:', patient);
  }
</script>

<template>
  <!-- Tabla de pacientes con slots personalizados para cada columna -->
  <VaDataTable
    v-model:sort-by="sortByVModel"
    v-model:sorting-order="sortingOrderVModel"
    :columns="columns"
    :items="patients"
    :loading="$props.loading"
    :clickable="false"
    @row:click="handleRowClick"
    class="va-table--hoverable"
  >
    <!-- Slots para personalizar la visualización de cada columna -->
    <template #cell(name)="{ rowData }">
      <div class="flex items-center gap-2 max-w-[230px] ellipsis capitalize">
        <!-- <UserAvatar :user="rowData as Patient" size="small" /> -->
        {{ rowData.name }}
      </div>
    </template>

    <template #cell(lastName)="{ rowData }">
      <div class="max-w-[120px] ellipsis capitalize">
        {{ rowData.lastName }}
      </div>
    </template>

    <template #cell(secondName)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ rowData.secondName ? rowData.secondName : 'N/A' }}
      </div>
    </template>

    <template #cell(secondLastName)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ rowData.secondLastName ? rowData.secondLastName : 'N/A' }}
      </div>
    </template>

    <template #cell(ci)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ formatCi(rowData.ci) }}
      </div>
    </template>

    <template #cell(birthDate)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ formatDate(rowData.birthDate) }}
      </div>
    </template>

    <template #cell(dir)="{ rowData }">
      <div class="ellipsis max-w-[230px] capitalize">
        {{ rowData.dir }}
      </div>
    </template>

    <template #cell(phoneNums)="{ rowData }">
      <div class="ellipsis max-w-[230px]">
        {{ displayPhones(rowData.phoneNums) }}
      </div>
    </template>

    <template #cell(actions)="{ rowData }">
      <div class="flex gap-2 justify-end">
        <VaButton
          preset="primary"
          size="small"
          icon="edit"
          aria-label="Edit patient"
          @click.stop="$emit('edit-patient', rowData as Patient)"
        />
        <VaButton
          preset="primary"
          size="small"
          icon="va-delete"
          color="danger"
          aria-label="Delete patient"
          @click.stop="onPatientDelete(rowData as Patient)"
        />
      </div>
    </template>
  </VaDataTable>

  <!-- Modal de detalles del paciente -->
  <VaModal v-model="isDetailsModalOpen" hide-default-actions size="large" blur>
    <h2 class="va-h3 text-primary">Detalles del paciente</h2>

    <div class="p-4 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <strong>Nombre:</strong>
          <p>{{ selectedPatient?.name || '-' }}</p>
        </div>

        <div>
          <strong>Apellido:</strong>
          <p>{{ selectedPatient?.lastName || '-' }}</p>
        </div>

        <div>
          <strong>Segundo Nombre:</strong>
          <p>{{ selectedPatient?.secondName || 'N/A' }}</p>
        </div>

        <div>
          <strong>Segundo Apellido:</strong>
          <p>{{ selectedPatient?.secondLastName || 'N/A' }}</p>
        </div>

        <div>
          <strong>CI:</strong>
          <p>{{ formatCi(selectedPatient?.ci) || '-' }}</p>
        </div>

        <div>
          <strong>Dirección:</strong>
          <p>{{ selectedPatient?.dir || '-' }}</p>
        </div>

        <div>
          <strong>Email:</strong>
          <p>{{ selectedPatient?.email || 'N/A' }}</p>
        </div>

        <div>
          <strong>Teléfonos:</strong>
          <p>{{ displayPhones(selectedPatient?.phoneNums || []) }}</p>
        </div>

        <div>
          <strong>Fecha de Nacimiento:</strong>
          <p>{{ formatDate(selectedPatient?.birthDate) }}</p>
        </div>

        <div>
          <strong>Edad Actual:</strong>
          <p>
            {{
              selectedPatient?.birthDate
                ? calculateAge(selectedPatient.birthDate)
                : '-'
            }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <VaButton @click="isDetailsModalOpen = false">Cerrar</VaButton>
      
      <VaButton color="primary" class="ml-2" @click="onAddExam(selectedPatient)"
      >Añadir Examen</VaButton
      >
       
      <VaButton
      color="primary"
      class="ml-2"
      @click="onViewExams(selectedPatient)"
      >Ver Examenes</VaButton
      >
    </template>
  </VaModal>

  <!-- Paginación y selección de resultados por página -->
  <div
    class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2"
  >
    <div>
      <b>{{ $props.pagination.total }} results.</b>
      Results per page
      <VaSelect
        v-model="$props.pagination.perPage"
        class="!w-20"
        :options="[10, 20, 50, 100]"
      />
    </div>

    <div v-if="totalPages > 1" class="flex">
      <VaButton
        preset="secondary"
        icon="va-arrow-left"
        aria-label="Previous page"
        :disabled="$props.pagination.page === 1"
        @click="$props.pagination.page--"
      />
      <VaButton
        class="mr-2"
        preset="secondary"
        icon="va-arrow-right"
        aria-label="Next page"
        :disabled="$props.pagination.page === totalPages"
        @click="$props.pagination.page++"
      />
      <VaPagination
        v-model="$props.pagination.page"
        buttons-preset="secondary"
        :pages="totalPages"
        :visible-pages="5"
        :boundary-links="false"
        :direction-links="false"
      />
    </div>
  </div>
</template>

<style scoped>
  .va-data-table .va-data-table__table-tr {
    border-bottom: 1px solid var(--va-background-border);
  }
.ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
