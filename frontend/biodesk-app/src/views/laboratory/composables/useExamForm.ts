// Importa función para obtener un examen vacío
import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';
// Importa el composable para manejar el modal de referencias
import { useReferenceModal } from './useReferenceModal';
// Importa reactive de Vue para la reactividad
import { reactive } from 'vue';
// Importa el API para interactuar con el catálogo de exámenes
import { medicTestCatalogApi } from '../../../services/api';
// Tipos para validación de datos
import type { AgeGroup, GenderValueRef } from '@/services/types/global.type';
import type { CreateMedicTestCatalogData } from '@/services/interfaces/medicTestCatalog';

// Composable principal para manejar el formulario de exámenes
export function useExamForm() {
  // Construye el payload para crear o actualizar un examen
  function buildExamPayload(): CreateMedicTestCatalogData {
    return {
      name: examForm.newExam.name.trim(),
      description: examForm.newExam.description.trim(),
      price: examForm.newExam.price,
      supplies: examForm.supplies.map((insumo) => insumo.trim()),
      properties: referenceModal.referenceData.value.map((ref) => ({
        name: ref.name.trim(),
        unit: ref.unit.trim(),
        valueReferences: ref.variations.map((variation) => ({
          range: variation.range.trim(),
          gender: variation.gender.trim() as GenderValueRef,
          ageGroup: variation.ageGroup.trim() as AgeGroup,
        })),
      })),
    };
  }

  // Instancia el composable del modal de referencias
  const referenceModal = useReferenceModal();
  // Estado reactivo del formulario de examen
  const examForm = reactive({
    newExam: getEmptyExam(), // Datos del nuevo examen
    newSupply: '', // Insumo temporal
    supplies: [] as string[], // Lista de insumos
    propertiesPairs: [] as { key: string; value: string }[], // Pares clave-valor de propiedades
    propertiesError: '', // Mensaje de error de propiedades
    isEditing: false, // Modo edición
    editingExamId: null as number | null, // ID del examen en edición
    showAddModal: false, // Estado del modal
  });

  // Cierra y limpia el modal de examen
  const closeModal = () => {
    examForm.showAddModal = false;
    examForm.isEditing = false;
    examForm.editingExamId = null;
    examForm.propertiesError = '';
    examForm.newExam = getEmptyExam();
    examForm.propertiesPairs = [];
    examForm.supplies = [];
    referenceModal.referenceData.value = [];
  };

  // Agrega un nuevo examen usando el API
  const addExam = async (
    fetchExams: () => Promise<void>,
    showError: (msg: string) => void
  ) => {
    const test = buildExamPayload();

    try {
      await medicTestCatalogApi.createMedicTestCatalog(test);
      await fetchExams();
      closeModal();
    } catch (error) {
      showError('Ocurrió un error al agregar el examen.');
      closeModal();
    }
  };

  // Actualiza un examen existente
  const updateExam = async (
    fetchExams: () => Promise<void>,
    showError: (msg: string) => void
  ) => {
    if (examForm.editingExamId === null) {
      showError('No hay examen para editar.');
      return;
    }
    const test = buildExamPayload();
    try {
      await medicTestCatalogApi.putMedicTestCatalog(
        examForm.editingExamId.toString(),
        test
      );
      await fetchExams();
      closeModal();
    } catch (error) {
      showError('Ocurrió un error al actualizar el examen.');
    }
  };

  // Elimina un examen del catálogo
  const deleteExam = async (
    row: any,
    fetchExams: () => Promise<void>,
    showError: (msg: string) => void
  ) => {
    try {
      await medicTestCatalogApi.deleteMedicTestCatalog(row.rowData.id);
      await fetchExams();
    } catch (error) {
      showError('Ocurrió un error al eliminar el examen.');
    }
  };

  // Prepara el formulario para editar un examen existente
  function editExam(row: any) {
    examForm.isEditing = true;
    examForm.editingExamId = row.rowData.id;

    // Asigna los datos básicos del examen
    examForm.newExam = {
      ...getEmptyExam(),
      name: row.rowData.name,
      description: row.rowData.description || '',
      price: row.rowData.price,
    };

    // Copia los insumos del examen
    examForm.supplies = Array.isArray(row.rowData.supplies)
      ? [...row.rowData.supplies]
      : [];

    // Limpia datos anteriores de referencias
    referenceModal.referenceData.value.splice(
      0,
      referenceModal.referenceData.value.length
    );

    // Carga las propiedades con validación segura
    if (Array.isArray(row.rowData.properties)) {
      row.rowData.properties.forEach((prop: any) => {
        referenceModal.referenceData.value.push({
          name: prop.name,
          unit: prop.unit,
          variations: Array.isArray(prop.variations)
            ? prop.variations.map((valueRef: any) => ({
                range: valueRef.range,
                gender: valueRef.gender,
                ageGroup: valueRef.ageGroup,
              }))
            : Array.isArray(prop.valueReferences)
            ? prop.valueReferences.map((valueRef: any) => ({
                range: valueRef.range,
                gender: valueRef.gender,
                ageGroup: valueRef.ageGroup,
              }))
            : [],
        });
      });
    }

    // Abre el modal de edición
    examForm.showAddModal = true;
  }

  // Exporta las funciones y el estado para ser usado en los componentes
  return {
    examForm,
    closeModal,
    addExam,
    updateExam,
    deleteExam,
    editExam,
  };
}
