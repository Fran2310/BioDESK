import { getAuthData } from '../../../utils/auth';
import { updateMedicTest, addMedicTest } from '../../../services/api';
import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';
import { useReferenceModal } from './useReferenceModal';
import { ref, reactive } from 'vue';

// Suponiendo que examForm, referenceModal, showError, fetchExams están definidos y exportados desde el composable principal o se pasan como argumentos
// Si no, deberías importarlos o recibirlos como parámetros

const { labId, token } = getAuthData();
const referenceModal = useReferenceModal();

// Ejemplo de examForm reactivo (debería venir de un composable principal)
const examForm = reactive({
    newExam: getEmptyExam(),
    newSupplie: '',
    supplies: [] as string[],
    propertiesPairs: [] as { key: string; value: string }[],
    propertiesError: '',
    isEditing: false,
    editingExamId: null as number | null,
    showAddModal: false
});

const closeModal = () => {
    examForm.showAddModal = false;
    examForm.isEditing = false;
    examForm.editingExamId = null;
    examForm.propertiesError = '';
    examForm.newExam = getEmptyExam();
    examForm.propertiesPairs = [];
    examForm.supplies = [];
};

const updateExam = async (fetchExams: () => Promise<void>, showError: (msg: string) => void) => {
    if (!labId || examForm.editingExamId === null) {
        console.error('No se ha seleccionado un laboratorio o no hay examen para editar.');
        return;
    }
    const test = {
        name: examForm.newExam.name,
        description: examForm.newExam.description,
        price: examForm.newExam.price,
        supplies: [...examForm.supplies],
        properties: referenceModal.referenceData.value.map(ref => ({
            name: ref.name,
            unit: ref.unit,
            valuesRef: ref.variations.map(variation => ({
                range: variation.range,
                gender: variation.gender,
                ageGroup: variation.ageGroup,
            })),
        })),
    };
    try {
        await updateMedicTest(labId, examForm.editingExamId, test, token);
        await fetchExams();
        closeModal();
    } catch (error) {
        console.error('Error al actualizar el examen:', error);
        showError('Ocurrió un error al actualizar el examen.');
    }
};

function editExam(row: any) {
    examForm.isEditing = true;
    examForm.editingExamId = row.rowData.id;
    examForm.newExam = {
        ...getEmptyExam(),
        name: row.rowData.name,
        description: row.rowData.description || '',
        price: row.rowData.price
    };
    examForm.supplies = [...row.rowData.supplies];
    referenceModal.referenceData.value = (row.rowData.properties as any[]).map((prop) => ({
        name: prop.name,
        unit: prop.unit,
        variations: prop.variations.map((valueRef: any) => ({
            range: valueRef.range,
            gender: valueRef.gender,
            ageGroup: valueRef.ageGroup
        }))
    }));
    examForm.showAddModal = true;
}

const addExam = async (fetchExams: () => Promise<void>, showError: (msg: string) => void) => {
    if (!labId || !token) {
        console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
        return;
    }
    const test = {
        name: examForm.newExam.name.trim(),
        description: examForm.newExam.description.trim(),
        price: examForm.newExam.price,
        supplies: examForm.supplies.map((insumo) => insumo.trim()),
        properties: referenceModal.referenceData.value.map((ref) => ({
            name: ref.name.trim(),
            unit: ref.unit.trim(),
            valuesRef: ref.variations.map((variation) => ({
                range: variation.range.trim(),
                gender: variation.gender.trim(),
                ageGroup: variation.ageGroup.trim(),
            })),
        })),
    };
    console.log('Objeto enviado al backend:', test);
    try {
        await addMedicTest(labId, test, token);
        await fetchExams();
        closeModal();
    } catch (error) {
        console.error('Error al agregar el examen:', error);
        showError('Ocurrió un error al agregar el examen.');
    }
};

export { closeModal, updateExam, editExam, addExam };