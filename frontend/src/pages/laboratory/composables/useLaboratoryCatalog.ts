import { reactive, ref, computed } from 'vue';
import { fetchMedicTests, addMedicTest, updateMedicTest, deleteMedicTest } from '../../../services/api';
import  { MedicTestCatalog, NewExam } from '../types';
import { useAuthStore } from '../../../stores/authStore';
import { getAuthData } from '../../../utils/auth';
import { ReferenceVariation } from '../types';
import { ReferenceProperty } from '../types';
import { RemoveVariationFn } from '../types';
import { useReferenceModal } from './useReferenceModal';
import { getEmptyExam } from '../helpers/laboratoryCatalogHelpers';

export function useLaboratoryCatalog() {
    // Agrupa los refs del formulario y modal de examen
    const examForm = reactive({
        newExam: getEmptyExam(),
        newSupplie: '',
        supplies: [] as string[],
        propertiesPairs: [] as { key: string; value: string }[],
        propertiesError: '',
        isEditing: false,
        editingExamId: null as number | null,
        showAddModal: false
    });

    // Agrupa los refs de la tabla y búsqueda
    const tableState = reactive({
        search: '',
        exams: [] as MedicTestCatalog[],
        loading: false
    });

    // Modal de referencias
    const referenceModal = useReferenceModal();

    const { labId, token } = getAuthData();
    const authStore = useAuthStore();

    //para el manejo de referencias
    const referenceValues = ref([
    { ageGroup: "adult", sex: "any", value: "120-140" },
    ]); // Lista de valores de referencia



    const addSupplies = () => {
        if (examForm.newSupplie && examForm.supplies.length < 10) {
            examForm.supplies.push(examForm.newSupplie.trim());
            examForm.newSupplie = '';
        }
    };

    const removeInsumo = (index: number) => {
        examForm.supplies.splice(index, 1);
    };

    const columns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Nombre', sortable: true },
        { key: 'description', label: 'Descripción' },
        { key: 'price', label: 'Precio', sortable: true },
        { key: 'actions', label: 'Acciones' },
    ];

    const filteredExams = computed(() => {
        if (!tableState.search) return tableState.exams;
        return tableState.exams.filter(e =>
            e.name.toLowerCase().includes(tableState.search.toLowerCase()) ||
            (e.description && e.description.toLowerCase().includes(tableState.search.toLowerCase()))
        );
    });

    const addProperty = () => {
        examForm.propertiesPairs.push({ key: '', value: '' });
    };

    const removeProperty = (idx: number) => {
        examForm.propertiesPairs.splice(idx, 1);
    };

    const closeModal = () => {
        examForm.showAddModal = false;
        examForm.isEditing = false;
        examForm.editingExamId = null;
        examForm.propertiesError = '';
        examForm.newExam = getEmptyExam();
        examForm.propertiesPairs = [];
        examForm.supplies = [];
    };

    const fetchExams = async () => {
        if (!labId || !token) {
            console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
            return;
        }
        tableState.loading = true;
        try {
            tableState.exams = await fetchMedicTests(labId, token);
        } catch (error) {
            console.error(error);
            showError('Ocurrió un error al obtener los exámenes.');
        } finally {
            tableState.loading = false;
        }
    };

    const addExam = async () => {
        if (!labId || !token) {
            console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
            return;
        }
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
        try {
            await addMedicTest(labId, test, token);
            await fetchExams();
            closeModal();
        } catch (error) {
            console.error('Error al agregar el examen:', error);
            showError('Ocurrió un error al agregar el examen.');
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
        referenceModal.referenceData.value = (row.rowData.properties as ReferenceProperty[]).map((prop) => ({
            name: prop.name,
            unit: prop.unit,
            variations: prop.variations.map((valueRef: ReferenceVariation) => ({
                range: valueRef.range,
                gender: valueRef.gender,
                ageGroup: valueRef.ageGroup
            }))
        }));
        examForm.showAddModal = true;
    }

    const updateExam = async () => {
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
            await updateMedicTest(labId, examForm.editingExamId, test, token);
            await fetchExams();
            closeModal();
        } catch (error) {
            console.error('Error al actualizar el examen:', error);
            showError('Ocurrió un error al actualizar el examen.');
        }
    };

    const deleteExam = async (row: any) => {
        if (!labId) {
            console.error('No se ha seleccionado un laboratorio.');
            return;
        }
        try {
            await deleteMedicTest(labId, row.rowData.id, token);
            await fetchExams();
        } catch (error) {
            console.error('Error al eliminar el examen:', error);
            showError('Ocurrió un error al eliminar el examen.');
        }
    };

    function viewDetails(row: MedicTestCatalog) {
        alert(`Detalles de: ${row.name}`);
    }

    //modal para agregar valores de referencia
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


    const showError = (message: string) => {
    alert(message); 
    };


    const removeVariation: RemoveVariationFn = (referenceIndex, variationIndex) => {
        referenceData.value[referenceIndex].variations.splice(variationIndex, 1);
    };

    function openModalForNewReference() {
    selectedReference.value = { name: "", unit: "", variations: [] };
    isEditingReference.value = false;
    showModal.value = true;
    }


    function openModalForNewVariation(referenceIndex: number) {
        selectedReferenceIndex.value = referenceIndex;
        selectedVariation.value = { ageGroup: "", gender: "", range: "" };
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

    if (referenceIdx === null) return; // No se puede guardar si no hay referencia seleccionada

    if (isEditingVariation.value) {
        if (variationIdx !== null) {
        referenceData.value[referenceIdx].variations[variationIdx] = { ...selectedVariation.value };
        }
    } else {
        referenceData.value[referenceIdx].variations.push({ ...selectedVariation.value });
    }

    showVariationModal.value = false;
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
        removeInsumo,
        addProperty,
        removeProperty,
        removeVariation,
        saveVariation,
        fetchExams,
        addExam,
        editExam,
        updateExam,
        deleteExam,
        closeModal,
        viewDetails,
        showError,
        openModalForNewReference,
        openModalForNewVariation,
        editVariation,
        printLabId,
        // ...otros helpers y refs
    };
}

// Helper para obtener un objeto NewExam vacío
