import { getAuthData } from '../../../utils/auth';
import { updateMedicTest, addMedicTest, deleteMedicTest } from '../../../services/api';
import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';
import { useReferenceModal } from './useReferenceModal';
import { reactive } from 'vue';

import { computed } from 'vue'

export function useExamForm() {
    const { labId, token } = getAuthData();
    const referenceModal = useReferenceModal();
    const examForm = reactive({
        newExam: getEmptyExam(),
        newSupply: '',
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
        // NO limpiar referenceModal.referenceData.value aquí
        referenceModal.referenceData.value = [];
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
            await updateMedicTest(labId!, examForm.editingExamId, test, token!);
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
        // Mantener la reactividad: limpiar y hacer push, NO sobrescribir el array
        referenceModal.referenceData.value.splice(0, referenceModal.referenceData.value.length);
        (row.rowData.properties as any[]).forEach((prop) => {
            referenceModal.referenceData.value.push({
                name: prop.name,
                unit: prop.unit,
                variations: prop.variations.map((valueRef: any) => ({
                    range: valueRef.range,
                    gender: valueRef.gender,
                    ageGroup: valueRef.ageGroup
                }))
            });
        });
        examForm.showAddModal = true;
    }

    const addExam = async (fetchExams: () => Promise<void>, showError: (msg: string) => void) => {
        /*if (!labId || !token) {
            console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
            return;
        }*/
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
        /*try {
            await addMedicTest(labId!, test, token!);
            await fetchExams();
            closeModal();
        } catch (error) {
            console.error('Error al agregar el examen:', error);
            showError('Ocurrió un error al agregar el examen.');
            closeModal();
        }*/
    };

    const deleteExam = async (row: any) => {
        if (!labId) {
            console.error('No se ha seleccionado un laboratorio.');
            return;
        }
        try {
            await deleteMedicTest(labId!, row.rowData.id, token!);
            // Si tienes fetchExams y showError en el scope, puedes llamarlos aquí si lo deseas
        } catch (error) {
            console.error('Error al eliminar el examen:', error);
            // Si tienes showError, puedes llamarlo aquí
        }
    };


    return {
        examForm,
        closeModal,
        updateExam,
        editExam,
        addExam,
        deleteExam,
    };
}