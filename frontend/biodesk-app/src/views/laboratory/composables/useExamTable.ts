import { computed, reactive } from 'vue';
import type { MedicTestCatalog } from '../types';
import { medicTestCatalogApi } from '../../../services/api'; // <-- Usa la API centralizada

// Estado reactivo para la tabla de exámenes
type ExamTableState = {
  search: string;
  exams: MedicTestCatalog[];
  loading: boolean;
};

export const tableState = reactive<ExamTableState>({
  search: '',
  exams: [],
  loading: false,
});

export const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'description', label: 'Descripción' },
  { key: 'price', label: 'Precio', sortable: true },
  { key: 'actions', label: 'Acciones' },
];

export const filteredExams = computed(() => {
  if (!tableState.search) return tableState.exams;
  return tableState.exams.filter(
    (e) =>
      e.name.toLowerCase().includes(tableState.search.toLowerCase()) ||
      (e.description &&
        e.description.toLowerCase().includes(tableState.search.toLowerCase()))
  );
});

export function setTableLoading(value: boolean) {
  tableState.loading = value;
}

export async function fetchExams(showError?: (msg: string) => void) {
  setTableLoading(true);
  try {
    // Llama a la API centralizada (no necesitas labId ni token aquí si ya lo gestiona la API)
    const response = await medicTestCatalogApi.getMedicTestCatalog({
      offset: 0,
      limit: 100,
      includeData: true,
    });

    console.log('📦 Exámenes cargados:', response.data);

    // ✅ Asegúrate de que esto es un array
    tableState.exams = response.data?.data ?? [];
  } catch (error) {
    if (showError) showError('Ocurrió un error al obtener los exámenes.');
    else console.error('Ocurrió un error al obtener los exámenes.', error);
  } finally {
    setTableLoading(false);
  }
}
