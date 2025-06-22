import { ref } from 'vue';
import type { ReferenceProperty, ReferenceVariation } from '../types';

export function useReferenceModal() {
  const showModal = ref(false);
  const showVariationModal = ref(false);
  const isEditingReference = ref(false);
  const isEditingVariation = ref(false);

  const referenceData = ref<ReferenceProperty[]>([]);
  const selectedReference = ref<ReferenceProperty>({
    name: '',
    unit: '',
    variations: []
  });
  const selectedVariation = ref<ReferenceVariation>({
    ageGroup: '',
    gender: '',
    range: ''
  });

  const selectedReferenceIndex = ref<number | null>(null);
  const selectedVariationIndex = ref<number | null>(null);

  const ageGroups = ['CHILD', 'ADULT', 'ANY'];
  const genderOptions = ['MALE', 'FEMALE', 'ANY'];

  return {
    showModal,
    showVariationModal,
    isEditingReference,
    isEditingVariation,
    referenceData,
    selectedReference,
    selectedVariation,
    selectedReferenceIndex,
    selectedVariationIndex,
    ageGroups,
    genderOptions
  };
}