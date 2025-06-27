import { reactive } from 'vue';
import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';

// Estado reactivo para el formulario de examen (debería ser compartido o recibido como prop/argumento)
export const examForm = reactive({
    newExam: getEmptyExam(),
    newSupplie: '',
    supplies: [] as string[],
    propertiesPairs: [] as { key: string; value: string }[],
    propertiesError: '',
    isEditing: false,
    editingExamId: null as number | null,
    showAddModal: false
});

export function useExamProperties() {
    function addProperty() {
        examForm.propertiesPairs.push({ key: '', value: '' });
    }

    function removeProperty(idx: number) {
        examForm.propertiesPairs.splice(idx, 1);
    }

    return { addProperty, removeProperty, examForm };
}