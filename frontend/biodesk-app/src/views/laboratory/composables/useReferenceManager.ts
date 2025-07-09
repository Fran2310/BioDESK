// Composable para gestionar el modal de referencias y variaciones
import { useReferenceModal } from './useReferenceModal';

// Desestructura los estados y helpers del modal de referencia
const {
    showModal,
    showVariationModal,
    referenceData,
    selectedReference,
    isEditingReference,
    selectedReferenceIndex,
    selectedVariation,
    isEditingVariation
} = useReferenceModal();


// Guarda una referencia (nueva o editada) en el arreglo de referencias
export function saveReference() {
    let newIndex: number | null = null;
    if (isEditingReference.value) {
        // Si está en modo edición, actualiza la referencia existente
        if (selectedReferenceIndex.value !== null) {
            referenceData.value[selectedReferenceIndex.value] = { ...selectedReference.value, variations: [...selectedReference.value.variations] }
        }
        showModal.value = false
        // Limpia selectedReference para evitar referencias compartidas y refrescar el formulario
        selectedReference.value = { name: '', unit: '', variations: [] }
    } else {
        // Si es una nueva referencia, la agrega al arreglo
        referenceData.value.push({ ...selectedReference.value, variations: [] })
        newIndex = referenceData.value.length - 1
        showModal.value = false
        // Abre automáticamente el modal de variación para la nueva referencia
        selectedReferenceIndex.value = referenceData.value.length - 1
        selectedVariation.value = { ageGroup: '', gender: '', range: '' }
        isEditingVariation.value = false
        showVariationModal.value = true
        selectedReference.value = { name: '', unit: '', variations: [] }
    }
    return newIndex
}

// Prepara el modal para editar una referencia existente
export function editReference(index:number) {
    selectedReferenceIndex.value = index;
    selectedReference.value = { ...referenceData.value[index] };
    isEditingReference.value = true;
    showModal.value = true;
}

// Elimina una referencia del arreglo por índice
export function removeReference(index:number) {
    referenceData.value.splice(index, 1);
}