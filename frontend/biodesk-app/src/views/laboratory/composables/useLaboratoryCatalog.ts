// Importa los composables y helpers necesarios para el catálogo de laboratorio
import { useReferenceModal } from './useReferenceModal';
import { useExamForm } from './useExamForm';
import { useSupplies } from './useSupplies';
import { useExamProperties } from './useExamPropierties';
import { tableState, columns, filteredExams, fetchExams } from './useExamTable';
import type { MedicTestCatalog, RemoveVariationFn } from '../types';
import { saveReference, removeReference } from './useReferenceManager'

export function useLaboratoryCatalog() {
    // Agrupa los formularios y helpers principales del catálogo
    const { examForm, closeModal, updateExam, editExam, addExam, deleteExam } = useExamForm();
    // Métodos para manejar insumos
    const { addSupplies, removeSupply } = useSupplies(examForm);
    // Métodos para manejar propiedades del examen
    const { addProperty, removeProperty } = useExamProperties();
    // Composable para manejar el modal de referencias
    const referenceModal = useReferenceModal();

    // Desestructura los estados y helpers del modal de referencia
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

    // Muestra detalles de un examen (puedes personalizar este método)
    function viewDetails(row: MedicTestCatalog) {
        alert(`Detalles de: ${row.name}`);
    }

    // Muestra un error en pantalla
    const showError = (message: string) => {
        alert(message);
    };

    // Elimina una variación de referencia por índice
    const removeVariation: RemoveVariationFn = (referenceIndex, variationIndex) => {
        referenceData.value[referenceIndex].variations.splice(variationIndex, 1);
    };

    // Abre el modal para agregar una nueva referencia
    function openModalForNewReference() {
        selectedReference.value = { name: '', unit: '', variations: [] };
        isEditingReference.value = false;
        showModal.value = true;
    }

    // Abre el modal para agregar una nueva variación a una referencia
    function openModalForNewVariation(referenceIndex: number) {
        selectedReferenceIndex.value = referenceIndex;
        selectedVariation.value = { ageGroup: '', gender: '', range: '' };
        isEditingVariation.value = false;
        showVariationModal.value = true;
    }

    // Abre el modal para editar una variación existente
    function editVariation(referenceIndex: number, variationIndex: number) {
        selectedReferenceIndex.value = referenceIndex;
        selectedVariationIndex.value = variationIndex;
        selectedVariation.value = { ...referenceData.value[referenceIndex].variations[variationIndex] };
        isEditingVariation.value = true;
        showVariationModal.value = true;
    }

    // Guarda una variación (nueva o editada) en la referencia seleccionada
    function saveVariation() {
        const referenceIdx = selectedReferenceIndex.value;
        const variationIdx = selectedVariationIndex.value;

        // Validación de campos obligatorios
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

        // Si está en modo edición, actualiza la variación, si no, la agrega
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

    // Exporta todos los métodos y estados necesarios para el catálogo de laboratorio
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
        fetchExams,
        // ...otros helpers y refs
    };
}
