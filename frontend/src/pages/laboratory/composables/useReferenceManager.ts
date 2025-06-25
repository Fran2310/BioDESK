//modal for managing references and variations
import { useReferenceModal } from './useReferenceModal';

const {
    showModal,
    showVariationModal,
    referenceData,
    selectedReference,
    isEditingReference,
    selectedReferenceIndex,
    selectedVariation,
    selectedVariationIndex,
    isEditingVariation
} = useReferenceModal();


export function saveReference() {
    let newIndex: number | null = null;
    if (isEditingReference.value) {
        if (selectedReferenceIndex.value !== null) {
            referenceData.value[selectedReferenceIndex.value] = { ...selectedReference.value, variations: [...selectedReference.value.variations] }
        }
        showModal.value = false
        // Limpiar selectedReference para evitar referencias compartidas y refrescar el formulario
        selectedReference.value = { name: '', unit: '', variations: [] }
    } else {
        // Push la nueva referencia
        referenceData.value.push({ ...selectedReference.value, variations: [] })
        newIndex = referenceData.value.length - 1
        showModal.value = false
        // Abrir automáticamente el modal de variación para la nueva referencia
        selectedReferenceIndex.value = referenceData.value.length - 1
        selectedVariation.value = { ageGroup: '', gender: '', range: '' }
        isEditingVariation.value = false
        showVariationModal.value = true
        selectedReference.value = { name: '', unit: '', variations: [] }
    }
    return newIndex
}

export function editReference(index:number) {
    selectedReferenceIndex.value = index;
    selectedReference.value = { ...referenceData.value[index] };
    isEditingReference.value = true;
    showModal.value = true;
}

export function removeReference(index:number) {
    referenceData.value.splice(index, 1);
}