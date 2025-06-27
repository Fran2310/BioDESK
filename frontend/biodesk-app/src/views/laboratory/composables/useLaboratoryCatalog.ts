import { ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore';
import { getAuthData } from '../../../utils/auth';
import { useReferenceModal } from './useReferenceModal';
import { useExamForm } from './useExamForm';
import { useSupplies } from './useSupplies';
import { useExamProperties } from './useExamPropierties';
import { tableState, columns, filteredExams, fetchExams } from './useExamTable';
import type { MedicTestCatalog, RemoveVariationFn } from '../types';
import { saveReference, removeReference } from './useReferenceManager'

export function useLaboratoryCatalog() {
    // Formularios y helpers agrupados
    const { examForm, closeModal, updateExam, editExam, addExam, deleteExam } = useExamForm();
    const { addSupplies, removeSupply } = useSupplies(examForm);
    const { addProperty, removeProperty } = useExamProperties();
    const referenceModal = useReferenceModal();
    const { labId, token } = getAuthData();
    const authStore = useAuthStore();

    // Helpers y modales de referencia
    const {
        showModal,
        showVariationModal,
        referenceData,
        selectedReference,
        isEditingReference,
        selectedReferenceIndex,
        selectedVariation,
        selectedVariationIndex,
        isEditingVariation,
    } = referenceModal;

    function viewDetails(row: MedicTestCatalog) {
        alert(`Detalles de: ${row.name}`);
    }

    const showError = (message: string) => {
        alert(message);
    };

    const removeVariation: RemoveVariationFn = (referenceIndex, variationIndex) => {
        referenceData.value[referenceIndex].variations.splice(variationIndex, 1);
    };

    function openModalForNewReference() {
        selectedReference.value = { name: '', unit: '', variations: [] };
        isEditingReference.value = false;
        showModal.value = true;
    }

    function openModalForNewVariation(referenceIndex: number) {
        selectedReferenceIndex.value = referenceIndex;
        selectedVariation.value = { ageGroup: '', gender: '', range: '' };
        isEditingVariation.value = false;
        showVariationModal.value = true;
    }

    function editVariation(referenceIndex: number, variationIndex: number) {
        selectedReferenceIndex.value = referenceIndex;
        selectedVariationIndex.value = variationIndex;
        selectedVariation.value = { ...referenceData.value[referenceIndex].variations[variationIndex] };
        isEditingVariation.value = true;
        showVariationModal.value = true;
    }

    function saveVariation() {
        const referenceIdx = selectedReferenceIndex.value;
        const variationIdx = selectedVariationIndex.value;

        if (
            referenceIdx === null ||
            !selectedVariation.value.ageGroup ||
            !selectedVariation.value.gender ||
            !selectedVariation.value.range
        ) {
            showError('Completa todos los campos de la variación.');
            return;
        }

        // Asegura que el array de variaciones existe
        if (!referenceData.value[referenceIdx].variations) {
            referenceData.value[referenceIdx].variations = [];
        }

        if (isEditingVariation.value) {
            if (variationIdx !== null && referenceData.value[referenceIdx]?.variations[variationIdx]) {
                referenceData.value[referenceIdx].variations[variationIdx] = { ...selectedVariation.value };
            } else {
                showError('No se pudo editar la variación.');
            }
        } else {
            referenceData.value[referenceIdx].variations.push({ ...selectedVariation.value });
        }

        // Limpiar y cerrar modal
        showVariationModal.value = false;
        selectedVariationIndex.value = null;
        selectedVariation.value = { ageGroup: '', gender: '', range: '' };
    }

    function printLabId() {
        if (!labId) {
            console.error('No se ha seleccionado un laboratorio.');
            return;
        }
        console.log('ID del laboratorio actual:', labId);
    }

    return {
        examForm,
        tableState,
        referenceModal,
        columns,
        filteredExams,
        addSupplies,
        removeSupply,
        addProperty,
        removeProperty,
        removeVariation,
        saveVariation,
        addExam,
        editExam,
        saveReference,
        removeReference,
        updateExam,
        deleteExam,
        closeModal,
        viewDetails,
        showError,
        openModalForNewReference,
        openModalForNewVariation,
        editVariation,
        printLabId,
        fetchExams,
        labId,
        token,
        // ...otros helpers y refs
    };
}
