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
    if (isEditingReference.value) {
        if (selectedReferenceIndex.value !== null) {
        referenceData.value[selectedReferenceIndex.value] = { ...selectedReference.value };
        }
    } else {
        referenceData.value.push({ ...selectedReference.value });
    }
    showModal.value = false;
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