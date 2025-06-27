<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useToast, useModal } from 'vuestic-ui';
  import { useI18n } from 'vue-i18n';
  import PatientsForm from './widgets/PatientsForm.vue';
  import CustomPatientsTable from './widgets/CustomPatientsTable.vue';
  // import { useLabStore } from '../../stores/labStore'
  import { patientApi } from '@/services/api';

  import type { GetExtendQuerys } from '@/services/interfaces/global';

  const { t } = useI18n();
  // const labStore = useLabStore()
  const isLoading = ref(false);
  const error = ref<any>(null);
  const filters = ref({ isActive: true, search: '' });
  const sorting = ref({ sortBy: 'fullname', sortingOrder: null });
  const pagination = ref({ page: 1, perPage: 20, total: 0 });
  const patients = ref<Patient[]>([]);

  const fetchPatients = async (extraQuery: Partial<GetExtendQuerys> = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const query: GetExtendQuerys = {
        offset: (pagination.value.page - 1) * pagination.value.perPage,
        limit: pagination.value.perPage,
        includeData: true,
        ...extraQuery,
      };
      const response = await patientApi.getPatients(query);
      const responseData = response.data;
      console.log('Patients API response:', responseData);
      patients.value = responseData.data;
      pagination.value.total = responseData.total;
      pagination.value.page =
        Math.floor(responseData.offset / responseData.limit) + 1;
      pagination.value.perPage = responseData.limit;
    } catch (e: any) {
      error.value = e;
      console.error('fetchPatients error', e);
    } finally {
      isLoading.value = false;
    }
  };

  const onSearchByName = () => {
    fetchPatients({
      'search-term': filters.value.search,
      'search-fields': ['name'],
    });
  };

  onMounted(() => {
    fetchPatients();
  });

  /* watch(
  filters,
  () => {
    pagination.value.page = 1
    fetchPatients()
  },
  { deep: true },
) */

  watch([() => sorting.value.sortBy, () => sorting.value.sortingOrder], () => {
    fetchPatients();
  });

  watch(
    () => pagination.value.page,
    () => {
      fetchPatients();
    }
  );

  const doShowEditPatientModal = ref(false);
  const patientToEdit = ref<Patient | null>(null);
  const formKey = ref(0);

  const showEditPatientModal = (patient: PatientData) => {
    formKey.value += 1;
    patientToEdit.value = patient;
    doShowEditPatientModal.value = true;
  };

  const showAddPatientModal = () => {
    if (
      editFormRef.value &&
      typeof editFormRef.value.resetForm === 'function'
    ) {
      editFormRef.value.resetForm();
    }
    formKey.value += 1;
    patientToEdit.value = null;
    doShowEditPatientModal.value = true;
  };

  const { init: notify } = useToast();

  watch(error, (val) => {
    if (val) {
      notify({
        message: val.message,
        color: 'danger',
      });
    }
  });

  const onPatientSaved = async (patient: Patient) => {
    isLoading.value = true;
    try {
      if (patientToEdit.value && patient.id) {
        // Omit id for update payload if not needed by backend
        const { id, ...updateData } = patient;
        await patientApi.updatePatient(id, updateData);
        notify({
          message: `${patient.name} has been updated`,
          color: 'success',
        });
      } else {
        // Omit id for create payload
        const { id, ...createData } = patient;
        await patientApi.createPatient(createData);
        notify({
          message: `${patient.name} has been created`,
          color: 'success',
        });
      }
      await fetchPatients();
    } catch (e: any) {
      error.value = e;
      console.error('onPatientSaved error', e);
    } finally {
      isLoading.value = false;
    }
  };

  const onPatientDelete = async (patient: Patient) => {
    isLoading.value = true;
    try {
      await patientApi.deletePatient(patient.id);
      notify({ message: `${patient.name} has been deleted`, color: 'success' });
      await fetchPatients();
    } catch (e: any) {
      error.value = e;
      console.error('onPatientDelete error', e);
    } finally {
      isLoading.value = false;
    }
  };

  const { confirm } = useModal();
  const editFormRef = ref();

  const beforeEditFormModalClose = async (hide: () => unknown) => {
    if (editFormRef.value?.isFormHasUnsavedChanges) {
      const agreed = await confirm({
        maxWidth: '380px',
        message: 'Form has unsaved changes. Are you sure you want to close it?',
        size: 'small',
      });
      if (agreed) {
        hide();
      }
    } else {
      hide();
    }
  };
</script>

<template>
  <div>
    <h1 class="page-title">{{ t('menu.patients') }}</h1>
    <VaCard>
      <VaCardContent>
        <div class="flex flex-col md:flex-row gap-2 mb-2 justify-between">
          <div
            class="flex flex-col md:flex-row gap-2 justify-start items-center"
          >
            <VaInput v-model="filters.search" placeholder="Search">
              <template #prependInner>
                <VaIcon name="search" color="secondary" size="small" />
              </template>
            </VaInput>
            <VaButton
              @click="onSearchByName"
              color="primary"
              icon="search"
              class="ml-2"
            >
              Search by Name
            </VaButton>
          </div>
          <VaButton @click="showAddPatientModal">{{
            t('form.addPatient')
          }}</VaButton>
        </div>
        <CustomPatientsTable
          v-model:sort-by="sorting.sortBy"
          v-model:sorting-order="sorting.sortingOrder"
          :patients="patients"
          :loading="isLoading"
          :pagination="pagination"
          @edit-patient="showEditPatientModal"
          @delete-patient="onPatientDelete"
        />
      </VaCardContent>
    </VaCard>
    <VaModal
      v-model="doShowEditPatientModal"
      size="small"
      mobile-fullscreen
      close-button
      hide-default-actions
      :before-cancel="beforeEditFormModalClose"
      v-slot="{ cancel, ok }"
    >
      <h1 class="va-h5">
        {{ patientToEdit ? t('form.editPatient') : t('form.addPatient') }}
      </h1>
      <PatientsForm
        :key="formKey"
        ref="editFormRef"
        :patient="patientToEdit"
        :save-button-label="patientToEdit ? t('form.save') : t('form.add')"
        @close="cancel"
        @save="
          (patient) => {
            onPatientSaved(patient);
            ok();
          }
        "
      />
    </VaModal>
  </div>
</template>
