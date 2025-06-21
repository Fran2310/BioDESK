import { ref, computed } from 'vue';
import { fetchMedicTests, addMedicTest, updateMedicTest, deleteMedicTest } from '../../../services/api';
import  { MedicTestCatalog, NewExam } from '../types';
import { useAuthStore } from '../../../stores/authStore';

export function useLaboratoryCatalog() {
    const loading = ref(false)
    const newSupplie = ref('') //New Medical Supply
    const supplies = ref<string[]>([]); // Lista de supplies
    const search = ref('')
    const exams = ref<MedicTestCatalog[]>([])
    const showAddModal = ref(false)
    const isEditing = ref(false)
    const editingExamId = ref<number | null>(null)
    const propertiesError = ref('')

    const authStore = useAuthStore();
    const labId = authStore.currentLab?.id ?? null; // Obtiene el ID del laboratorio actual desde el store
    const token = authStore.token;
    

    //para el manejo de referencias
    const referenceValues = ref([
    { ageGroup: "adult", sex: "any", value: "120-140" },
    ]); // Lista de valores de referencia



    const addSupplies = () => {
    if (newSupplie.value && supplies.value.length < 10) {
        supplies.value.push(newSupplie.value.trim());
        newSupplie.value = "";
    }
    }

    const removeInsumo = () => (index: number) => {
    supplies.value.splice(index, 1);
    }

    const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'description', label: 'Descripción' },
    { key: 'price', label: 'Precio', sortable: true },
    { key: 'actions', label: 'Acciones' },
    ]

    const filteredExams = computed(() => {
    if (!search.value) return exams.value
    return exams.value.filter(e =>
        e.name.toLowerCase().includes(search.value.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(search.value.toLowerCase()))
    )
    })


    const propertiesPairs = ref<{ key: string; value: string }[]>([])

    const addProperty = () => {
    propertiesPairs.value.push({ key: '', value: '' })
    }

    const removeProperty = (idx: number)=> {
    propertiesPairs.value.splice(idx, 1)
    }

    function propertiesFromPairs() {
    const obj: Record<string, any> = {}
    for (const { key, value } of propertiesPairs.value) {
        if (key.trim()) obj[key.trim()] = value
    }
    return Object.keys(obj).length ? obj : undefined
    }

    function pairsFromProperties(obj: any) {
    if (!obj || typeof obj !== 'object') return []
    return Object.entries(obj).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
    }

    const getEmptyExam = (): NewExam => ({
        name: '',
        description: '',
        suppliesText: '',
        price: 0,
        propertiesText: ''
    })

    const newExam = ref<NewExam>(getEmptyExam());// Close Modal

    const closeModal = () => {
    showAddModal.value = false
    isEditing.value = false
    editingExamId.value = null
    propertiesError.value = ''
    newExam.value = getEmptyExam();
    propertiesPairs.value = []
    supplies.value = [] // Limpia la lista de supplies
    }

    const fetchExams = async () => {
    if (!authData.labId || !authData.token) {
        console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
        return;
    }

    loading.value = true;
    try {
        exams.value = await fetchMedicTests(labId, token);
    } catch (error) {
        console.error(error);
        showError('Ocurrió un error al obtener los exámenes.');
    } finally {
        loading.value = false;
    }
    };

    const addExam = async () => {
    if (!labId || !token) {
        console.error('No se ha seleccionado un laboratorio o no hay token disponible.');
        return;
    }

    const test = {
        name: newExam.value.name.trim(),
        description: newExam.value.description.trim(),
        price: newExam.value.price,
        supplies: supplies.value.map((insumo) => insumo.trim()),
        properties: referenceData.value.map((ref) => ({
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
        await addMedicTest(labId, test, token); // Pasa el ID del laboratorio y el token
        await fetchExams(); // Refresca la lista de exámenes
        closeModal(); // Cierra el modal
    } catch (error) {
        console.error('Error al agregar el examen:', error);
        showError('Ocurrió un error al agregar el examen.');
    }
    };


    function editExam(row: any) {
    console.log('Editando examen:', row); // Para depuración
    isEditing.value = true;
    editingExamId.value = row.rowData.id; // Accede al ID desde rowData
    newExam.value = {
        name: row.rowData.name,
        description: row.rowData.description || '',
        price: row.rowData.price,
    };
    supplies.value = [...row.rowData.supplies]; // Inicializa la lista de supplies correctamente
    referenceData.value = row.rowData.properties.map(prop => ({
        name: prop.name,
        unit: prop.unit,
        variations: prop.valuesRef.map(valueRef => ({
        range: valueRef.range,
        gender: valueRef.gender,
        ageGroup: valueRef.ageGroup,
        })),
    }));
    showAddModal.value = true;
    }

        const updateExam = async () => {
        if (!labId || editingExamId.value === null) {
            console.error('No se ha seleccionado un laboratorio o no hay examen para editar.');
            return;
        }

        const test = {
            name: newExam.value.name,
            description: newExam.value.description,
            price: newExam.value.price,
            supplies: [...supplies.value],
            properties: referenceData.value.map(ref => ({
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
            await updateMedicTest(labId, editingExamId.value, test); // Pasa el ID del laboratorio y el examen
            await fetchExams(); // Refresca la lista
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
        await deleteMedicTest(labId, row.rowData.id); // Pasa el ID del laboratorio y el examen
        await fetchExams(); // Refresca la lista
    } catch (error) {
        console.error('Error al eliminar el examen:', error);
        showError('Ocurrió un error al eliminar el examen.');
    }
    };

    function viewDetails(row: MedicTestCatalog) {
    // Aquí puedes abrir un modal o navegar a una página de detalles
    alert(`Detalles de: ${row.name}`)
    }

    //modal para agregar valores de referencia

    const showModal = ref(false);
    const showVariationModal = ref(false);
    const isEditingReference = ref(false);
    const isEditingVariation = ref(false);
    const referenceData = ref([]);
    const selectedReference = ref({ name: "", unit: "", variations: [] });
    const selectedVariation = ref({ ageGroup: "", gender: "", range: "" });
    const selectedReferenceIndex = ref(null);
    const selectedVariationIndex = ref(null);

    const ageGroups = ["CHILD", "ADULT", "ANY"];
    const genderOptions = ["MALE", "FEMALE", "ANY"];

    const showError = (message: string) => {
    alert(message); 
    };

    function removeVariation(referenceIndex, variationIndex) {
    referenceData.value[referenceIndex].variations.splice(variationIndex, 1);
    }

    function openModalForNewReference() {
    selectedReference.value = { name: "", unit: "", variations: [] };
    isEditingReference.value = false;
    showModal.value = true;
    }

    function editReference(index) {
    selectedReferenceIndex.value = index;
    selectedReference.value = { ...referenceData.value[index] };
    isEditingReference.value = true;
    showModal.value = true;
    }

    function saveReference() {
    if (isEditingReference.value) {
        referenceData.value[selectedReferenceIndex.value] = { ...selectedReference.value };
    } else {
        referenceData.value.push({ ...selectedReference.value });
    }
    showModal.value = false;
    }

    function removeReference(index) {
    referenceData.value.splice(index, 1);
    }

    function openModalForNewVariation(referenceIndex) {
    selectedReferenceIndex.value = referenceIndex;
    selectedVariation.value = { ageGroup: "", gender: "", range: "" };
    isEditingVariation.value = false;
    showVariationModal.value = true;
    }

    function editVariation(referenceIndex, variationIndex) {
    selectedReferenceIndex.value = referenceIndex;
    selectedVariationIndex.value = variationIndex;
    selectedVariation.value = { ...referenceData.value[referenceIndex].variations[variationIndex] };
    isEditingVariation.value = true;
    showVariationModal.value = true;
    }

    function saveVariation() {
    if (isEditingVariation.value) {
        referenceData.value[selectedReferenceIndex.value].variations[selectedVariationIndex.value] = { ...selectedVariation.value };
    } else {
        referenceData.value[selectedReferenceIndex.value].variations.push({ ...selectedVariation.value });
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

}