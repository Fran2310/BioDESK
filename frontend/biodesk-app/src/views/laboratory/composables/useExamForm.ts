import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';
import { useReferenceModal } from './useReferenceModal';
import { reactive } from 'vue';
import { medicTestCatalogApi } from '../../../services/api';
import type { AgeGroup, GenderValueRef } from '@/services/types/global.type';
import type { CreateMedicTestCatalogData } from '@/services/interfaces/medicTestCatalog';

export function useExamForm() {
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

  const referenceModal = useReferenceModal();
  const examForm = reactive({
    newExam: getEmptyExam(),
    newSupply: '',
    supplies: [] as string[],
    propertiesPairs: [] as { key: string; value: string }[],
    propertiesError: '',
    isEditing: false,
    editingExamId: null as number | null,
    showAddModal: false,
  });

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
            : [],
        });
      });
    }

    // Abre el modal de edición
    examForm.showAddModal = true;
  }

  return {
    examForm,
    closeModal,
    addExam,
    updateExam,
    deleteExam,
    editExam,
  };
}
