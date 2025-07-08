<template>
  <div>
    <VaCard>
      <VaCardContent>
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div
            class="flex flex-col md:flex-row gap-2 justify-start items-center"
          >
            <VaSelect
              v-model="filters.state"
              placeholder="Filtrar por estado"
              :options="states"
              text-by="label"
              value-by="value"
              clearable
              class="w-[200px]"
            />

            <VaSelect
              v-model="filters.priority"
              placeholder="Filtrar por prioridad"
              :options="priorities"
              text-by="label"
              value-by="value"
              clearable
              class="w-[200px]"
            />

            <VaButton
              color="primary"
              icon="search"
              class="ml-2"
              @click="searchExams"
            >
              Buscar
            </VaButton>
          </div>
        </div>

        <div class="relative overflow-x-hidden">
          <VaDataTable
            :columns="[
              { label: 'CI', key: 'ci' },
              { label: 'Nombre', key: 'name' },
              { label: 'Apellido', key: 'lastName' },
              { label: 'Examen', key: 'examName' },
              { label: 'Solicitado', key: 'requestedAt' },
              { label: 'Estado', key: 'state' },
              { label: 'Prioridad', key: 'priority' },
              { label: 'Acciones', key: 'actions', align: 'right' },
            ]"
            :items="
              exams.map((e) => ({ ...e, examName: e.medicTestCatalog.name }))
            "
            :loading="isLoading"
            @row:click="handleRowClick"
          >
            <template #cell(requestedAt)="{ rowData }">
              {{ formatDate(rowData.requestedAt) }}
            </template>
            <template #cell(state)="{ rowData }">
              <va-chip size="small" :color="stateColor(rowData.state)">
                {{ stateLabels[rowData.state] ?? rowData.state }}
              </va-chip>
            </template>
            <template #cell(priority)="{ rowData }">
              <va-chip size="small" :color="priorityColor(rowData.priority)">
                {{ priorityLabels[rowData.priority] ?? rowData.priority }}
              </va-chip>
            </template>
            
            <template #cell(actions)="{ rowData }">
              <div class="flex gap-2 justify-start">
                <VaPopover
                  v-if="rowData.state === 'COMPLETED'"
                  message="Descargar Resultados"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="download"
                    color="info"
                    aria-label="Acceder a examen"
                    @click.stop="downloadResults(rowData.id)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state === 'TO_VERIFY'"
                  message="Completar Examen"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="check"
                    color="success"
                    aria-label="Completar examen"
                    @click.stop="onCompleteExam(rowData)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state === 'IN_PROCESS'"
                  message="Subir Resultados"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="cloud_upload"
                    color="success"
                    aria-label="Subir resultados"
                    @click.stop="goToUploadResults(rowData.id)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state === 'PENDING'"
                  message="Empezar Examen"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="arrow_forward"
                    color="info"
                    aria-label="Empezar examen"
                    @click.stop="onProcessExam(rowData)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state === 'CANCELED'"
                  message="Colocar Examen en Pendiente"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="arrow_forward"
                    color="info"
                    aria-label="Colocar examen en pendiente"
                    @click.stop="onPendExam(rowData)"
                  />
                </VaPopover>

                <VaPopover
                  message="Modificar Prioridad"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="priority_high"
                    aria-label="Modificar examen"
                    @click.stop="openChangePriorityModal(rowData.id)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state !== 'COMPLETED' && rowData.state !== 'CANCELED'"
                  message="Cancelar Examen"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="cancel"
                    color="danger"
                    aria-label="Cancelar examen"
                    @click.stop="onCancelExam(rowData)"
                  />
                </VaPopover>

                <VaPopover
                  v-if="rowData.state === 'COMPLETED' || rowData.state === 'CANCELED'"
                  message="Eliminar Examen"
                  class="flex items-center justify-center"
                  hover-out-timeout=0
                  placement="top-end"
                  :auto-placement="true"
                >
                  <VaButton
                    preset="primary"
                    size="medium"
                    icon="delete"
                    color="danger"
                    aria-label="Eliminar examen"
                    @click.stop="onDeleteExam(rowData)"
                  />
                </VaPopover>
              </div>
            </template>
          </VaDataTable>

          <div
            v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10"
          >
            <VaProgressCircle indeterminate size="large" color="primary" />
          </div>
        </div>

        <VaModal v-model="showModal" hide-default-actions>
          <DetailsExam
          :selectedExam="selectedExam">
          </DetailsExam>
        </VaModal>

        <VaModal v-model="showStateModal" hide-default-actions>
          <ChangePriorityModal
            :changePriorityRequestId="changePriorityRequestId"
            @close="showStateModal = false"
            @updated="handleStateUpdated"
          />
        </VaModal>

        <VaModal v-model="showToPendModal" hide-default-actions>
          <ToPendExam
          :examToPend="examToPend"
          @close="showToPendModal = false"
          @processed="PendedExam()"
          >
          </ToPendExam>
        </VaModal>

        <VaModal v-model="showToProcessModal" hide-default-actions>
          <ToProcessExam
          :examToProcess="examToProcess"
          @close="showToProcessModal = false"
          @processed="ProcessedExam()"
          >
          </ToProcessExam>
        </VaModal>

        <VaModal v-model="showCancelModal" hide-default-actions>
          <CancelExam
          :examToCancel="examToCancel"
          @close="showCancelModal = false"
          @canceled="CanceledExam()"
          >
          </CancelExam>
        </VaModal>

        <VaModal v-model="showCompleteModal" hide-default-actions>
          <CompleteExam 
          :examToComplete="examToComplete"
          @close="showCompleteModal = false"
          @completed="CompletedExam()"
          >
          </CompleteExam>
        </VaModal>

        <VaModal v-model="showDeleteModal" hide-default-actions>
          <DeleteExam 
          :examToDelete="examToDelete"
          @close="showDeleteModal = false"
          @deleted="DeletedExam()"
          >
          </DeleteExam>
        </VaModal>
        
        <div
          class="flex flex-col-reverse md:flex-row gap-2 justify-between items-center py-2"
        >
          <div>
            <b>{{ pagination.total }} resultados.</b>
            Resultados por página
            <VaSelect
              v-model="pagination.perPage"
              class="!w-20"
              :options="[5, 10, 20, 50]"
            />
          </div>
          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <VaButton
              preset="secondary"
              icon="va-arrow-left"
              aria-label="Anterior"
              :disabled="pagination.page === 1"
              @click="pagination.page--"
            />
            <VaButton
              preset="secondary"
              icon="va-arrow-right"
              aria-label="Siguiente"
              :disabled="pagination.page === totalPages"
              @click="pagination.page++"
            />
            <VaPagination
              v-model="pagination.page"
              buttons-preset="secondary"
              :pages="totalPages"
              :visible-pages="5"
              :boundary-links="false"
              :direction-links="false"
            />
          </div>
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useToast } from 'vuestic-ui';

  import { medicTestRequestApi, storageApi } from '@/services/api';
  import ChangePriorityModal from './modals/ChangePriorityModal.vue';

  import type { GetExtendQuerys } from '@/services/interfaces/global';
  import type { SearchField } from '@/services/types/searchFields.type';

  import { formatCi, formatDate } from '@/services/utils';

  import DeleteExam from './modals/DeleteExam.vue'
  import CompleteExam from './modals/CompleteExam.vue';
  import CancelExam from './modals/CancelExam.vue';
  import DetailsExam from './modals/DetailsExam.vue';

  import { ExamRow, priorityColor, priorityLabels, stateColor, stateLabels } from '@/services/interfaces/exam-row';
import ToProcessExam from './modals/ToProcessExam.vue';
import ToPendExam from './modals/ToPendExam.vue';

  const { init: notify } = useToast();
  const router = useRouter();

  const props = defineProps<{ medicHistoryId?: string }>();

  const exams = ref<ExamRow[]>([]);
  const filters = ref({
    medicHistoryId: '',
    state: '',
    priority: '',
  });
  const pagination = ref({ page: 1, perPage: 10, total: 0 });
  const isLoading = ref(false);

  const showModal = ref(false);
  const selectedExam = ref<ExamRow | null>(null);

  const showStateModal = ref(false);
  const changePriorityRequestId = ref<number | null>(null);

  const showToPendModal = ref(false);
  const examToPend = ref<ExamRow | null>(null);

  const showToProcessModal = ref(false);
  const examToProcess = ref<ExamRow | null>(null);

  const showCancelModal = ref(false);
  const examToCancel = ref<ExamRow | null>(null);

  const showCompleteModal = ref(false);
  const examToComplete = ref<ExamRow | null>(null);

  const showDeleteModal = ref(false);
  const examToDelete = ref<ExamRow | null>(null);

  const fetchExams = async () => {
    isLoading.value = true;
    try {
      const query = {
        offset: (pagination.value.page - 1) * pagination.value.perPage,
        limit: pagination.value.perPage,
        includeData: true,
      };
      const { data } = await medicTestRequestApi.getMedicTestRequests(query);
      exams.value = data.data.map((e: ExamRow) => ({
        ...e,
        ci: formatCi(e.medicHistory?.patient?.ci) ?? '-', // Realmente creo que con este format es suficiente
        name: e.medicHistory?.patient?.name ?? '-',
        lastName: e.medicHistory?.patient?.lastName ?? '-',
      }));
      pagination.value.total = data.total;
    } catch (e: any) {
      notify({ message: e.message, color: 'danger' });
    } finally {
      isLoading.value = false;
    }
  };

  const searchExams = async () => {
    isLoading.value = true;

    try {
      const query: GetExtendQuerys = {
        offset: (pagination.value.page - 1) * pagination.value.perPage,
        limit: pagination.value.perPage,
        includeData: true,
      };

      const fields: SearchField[] = [];
      const terms: string[] = [];

      // Armar campos de búsqueda dinámica
      if (filters.value.state) {
        fields.push('state');
        terms.push(filters.value.state);
      }

      if (filters.value.priority) {
        fields.push('priority');
        terms.push(filters.value.priority);
      }

      if (fields.length > 0) {
        query['search-fields'] = fields;
        query['search-term'] = terms.join(',');
      }

      let response;

      // ✅ Lógica corregida aquí
      if (filters.value.medicHistoryId) {
        // Si hay ID, buscar solo por ese historial
        response =
          await medicTestRequestApi.getMedicTestRequestsByMedicHistoryId(
            filters.value.medicHistoryId,
            query
          );
        console.log('respuesta');
      } else {
        // Si no hay ID, buscar globalmente
        response = await medicTestRequestApi.getMedicTestRequests(query);
      }

      const { data } = response;

      exams.value = data.data.map((e: ExamRow) => ({
        ...e,
        ci: formatCi(e.medicHistory?.patient?.ci) ?? '-',
        name: e.medicHistory?.patient?.name ?? '-',
        lastName: e.medicHistory?.patient?.lastName ?? '-',
      }));

      pagination.value.total = data.total;
    } catch (e: any) {
      notify({
        message: e.message ?? 'Error al buscar exámenes',
        color: 'danger',
      });
    } finally {
      isLoading.value = false;
    }
  };


  // If medicHistoryId is passed as a prop, use it to fill the search bar and trigger search
  onMounted(() => {
    if (props.medicHistoryId) {
      console.log(props.medicHistoryId)
      filters.value.medicHistoryId = props.medicHistoryId
      searchExams()
    } else {
      fetchExams()
    }
  })

  watch(
    () => [pagination.value.page, pagination.value.perPage],
    // Llama a searchExams() cada vez que la página o los resultados por página cambien.
    () => {
      searchExams();
    }
  );

  function goToUploadResults(id: number) {
    router.push({ name: 'UploadResults', params: { id } });
  }

  const downloadResults = async (id: number) => {
    try {
      const response = await storageApi.getMedicResultsPdf(String(id))
      const data = response.data

      if (data?.url) {
        // Abrir en nueva pestaña
        window.open(data.url, '_blank')
      } else {
        notify({ message: 'No se encontró la URL', color: 'danger' });
        console.warn('No se encontró la URL en la respuesta.')
      }
    } catch (e: any) {
      notify({ message: 'No se encontró la URL', color: 'danger' });
      console.error('Error al obtener la URL:', e)
    }
  }

  function openChangePriorityModal(examId: number) {
    changePriorityRequestId.value = examId;
    showStateModal.value = true;
  }

  function handleRowClick(event: any) {
    if (event?.item) {
      selectedExam.value = { ...event.item };
      showModal.value = true;
    }
  }

  const refreshExams = async () => {
    await fetchExams();
  };

  function handleStateUpdated() {
    showStateModal.value = false;
    refreshExams();
  }

  function onPendExam(exam: ExamRow) {
    examToPend.value = exam
    showToPendModal.value = true;
  }
  function PendedExam() {
    showToPendModal.value = false;
    refreshExams();
  }

  function onProcessExam(exam: ExamRow) {
    examToProcess.value = exam
    showToProcessModal.value = true;
  }
  function ProcessedExam() {
    showToProcessModal.value = false;
    refreshExams();
  }

  function onCancelExam(exam: ExamRow) {
    examToCancel.value = exam
    showCancelModal.value = true;
  }
  function CanceledExam() {
    showCancelModal.value = false;
    refreshExams();
  }

  function onCompleteExam(exam: ExamRow) {
    examToComplete.value = exam;
    showCompleteModal.value = true;
  }
  function CompletedExam() {
    showCompleteModal.value = false;
    refreshExams();
  }

  function onDeleteExam(exam: ExamRow) {
    examToDelete.value = exam
    showDeleteModal.value = true;
  }
  function DeletedExam() {
    showDeleteModal.value = false;
    refreshExams();
  }

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.perPage)
  );

  const states = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'En proceso', value: 'IN_PROCESS' },
    { label: 'Completado', value: 'COMPLETED' },
    { label: 'Por verificar', value: 'TO_VERIFY' },
    { label: 'Cancelado', value: 'CANCELED' },
  ];

  const priorities = [
    { label: 'Alta', value: 'HIGH' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Baja', value: 'LOW' },
  ];
</script>

<style scoped>
/*
  Esta clase eliminará el fondo que aparece al pasar
  el mouse sobre los botones con preset="primary".
*/
.no-hover-effect:hover {
  background: transparent !important;
}
</style>