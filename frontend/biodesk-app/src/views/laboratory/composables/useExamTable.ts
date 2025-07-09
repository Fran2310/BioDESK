// Importa funciones de Vue para reactividad y propiedades computadas
import { computed, reactive } from 'vue';
// Tipo de datos para el catálogo de exámenes
import type { MedicTestCatalog } from '../types';
// API centralizada para operaciones con exámenes
import { medicTestCatalogApi } from '../../../services/api';

// Define el estado reactivo para la tabla de exámenes
type ExamTableState = {
  search: string; // Texto de búsqueda
  exams: MedicTestCatalog[]; // Lista de exámenes
  loading: boolean; // Estado de carga
};

// Estado global de la tabla de exámenes
export const tableState = reactive<ExamTableState>({
  search: '',
  exams: [],
  loading: false,
});

// Definición de las columnas de la tabla
export const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'description', label: 'Descripción' },
  { key: 'price', label: 'Precio', sortable: true },
  { key: 'actions', label: 'Acciones' },
];

// Computed para filtrar exámenes según el texto de búsqueda
export const filteredExams = computed(() => {
  if (!tableState.search) return tableState.exams;
  return tableState.exams.filter(
    (e) =>
      e.name.toLowerCase().includes(tableState.search.toLowerCase()) ||
      (e.description &&
        e.description.toLowerCase().includes(tableState.search.toLowerCase()))
  );
});

// Cambia el estado de carga de la tabla
export function setTableLoading(value: boolean) {
  tableState.loading = value;
}

// Obtiene los exámenes desde la API y actualiza el estado de la tabla
export async function fetchExams(showError?: (msg: string) => void) {
  setTableLoading(true);
  try {
    // Llama a la API centralizada (no necesitas labId ni token aquí si ya lo gestiona la API)
    const response = await medicTestCatalogApi.getMedicTestCatalog({
      offset: 0,
      limit: 100,
      includeData: true,
    });

    // Muestra en consola los exámenes cargados
    console.log('📦 Exámenes cargados:', response.data);

    // Asigna los exámenes al estado global
    tableState.exams = response.data?.data ?? [];
  } catch (error) {
    if (showError) showError('Ocurrió un error al obtener los exámenes.');
    else console.error('Ocurrió un error al obtener los exámenes.', error);
  } finally {
    setTableLoading(false);
  }
}
