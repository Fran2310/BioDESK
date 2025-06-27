import { computed, reactive } from 'vue';
import type { MedicTestCatalog } from '../types';
import { fetchMedicTests } from '../../../services/api';
import { getAuthData } from '../../../utils/auth';

// Estado reactivo para la tabla de exámenes
type ExamTableState = {
    search: string;
    exams: MedicTestCatalog[];
    loading: boolean;
};

export const tableState = reactive<ExamTableState>({
    search: '',
    exams: [],
    loading: false
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
    return tableState.exams.filter(e =>
        e.name.toLowerCase().includes(tableState.search.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(tableState.search.toLowerCase()))
    );
});

export function setTableLoading(value: boolean) {
    tableState.loading = value;
}

export async function fetchExams(showError?: (msg: string) => void) {
    const { labId, token } = getAuthData();
    if (!labId || !token) {
        if (showError) showError('No se ha seleccionado un laboratorio o no hay token disponible.');
        else console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
        return;
    }
    setTableLoading(true);
    try {
        tableState.exams = await fetchMedicTests(labId, token);
    } catch (error) {
        if (showError) showError('Ocurrió un error al obtener los exámenes.');
        else console.error('Ocurrió un error al obtener los exámenes.', error);
    } finally {
        setTableLoading(false);
    }
}
