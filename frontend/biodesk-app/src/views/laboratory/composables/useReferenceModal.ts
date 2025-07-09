
// Composable para manejar el estado de los modales de referencia y variaciones
import { ref } from 'vue';
import type { ReferenceProperty, ReferenceVariation } from '../types';

// Estado reactivo para mostrar/ocultar el modal de referencia
const showModal = ref(false);
// Estado reactivo para mostrar/ocultar el modal de variación
const showVariationModal = ref(false);
// Indica si se está editando una referencia existente
const isEditingReference = ref(false);
// Indica si se está editando una variación existente
const isEditingVariation = ref(false);
// Arreglo reactivo con todas las referencias agregadas
const referenceData = ref<ReferenceProperty[]>([]);
// Objeto reactivo para la referencia seleccionada (para crear o editar)
const selectedReference = ref<ReferenceProperty>({
  name: '',
  unit: '',
  variations: []
});
// Objeto reactivo para la variación seleccionada (para crear o editar)
const selectedVariation = ref<ReferenceVariation>({
  ageGroup: '',
  gender: '',
  range: ''
});
// Índice de la referencia seleccionada (para edición)
const selectedReferenceIndex = ref<number | null>(null);
// Índice de la variación seleccionada (para edición)
const selectedVariationIndex = ref<number | null>(null);
// Opciones de grupo de edad
const ageGroups = ['CHILD', 'ADULT', 'ANY'];
// Opciones de género
const genderOptions = ['MALE', 'FEMALE', 'ANY'];

// Exporta los estados y helpers para ser usados en otros composables/componentes
export function useReferenceModal() {
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
