<template>
  <div class="p-6">
    <VaCard class="mb-4 shadow-lg min-w-full" v-if="lab">
      <VaCardTitle class="flex justify-between items-center">
        <div class="text-2xl font-bold">
          {{ lab.name }}
        </div>
        <VaChip
          :color="lab.status === 'active' ? 'success' : 'danger'"
          size="small"
        >
          {{ lab.status === 'active' ? 'Activo' : 'Inactivo' }}
        </VaChip>
      </VaCardTitle>

      <VaCardContent class="space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="badge" color="primary" />
          <span class="text-sm text-gray-600">RIF:</span>
          <span class="font-medium">{{ lab.rif.toUpperCase() }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="place" color="primary" />
          <span class="text-sm text-gray-600">Dirección:</span>
          <span class="font-medium">{{ lab.dir }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start sm:gap-4">
          <VaIcon name="call" color="primary" class="mt-1" />
          <div>
            <span class="text-sm text-gray-600">Teléfonos:</span>
            <div class="font-medium">
              <div v-for="(phone, i) in lab.phoneNums" :key="i">
                {{ phone }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <VaIcon name="calendar_today" color="primary" />
          <span class="text-sm text-gray-600">Registrado en:</span>
          <span class="font-medium">{{ formatDate(lab.createdAt) }}</span>
        </div>
      </VaCardContent>

      <VaCardActions align="right">
        <VaButton icon="edit" color="primary" @click="onEditLab">
          Editar datos
        </VaButton>
        <VaButton icon="upload" color="info" @click="onOpenUpload">
          Subir logo
        </VaButton>
      </VaCardActions>
    </VaCard>

    <div
      v-else-if="loading"
      class="text-center mt-6 flex justify-center items-center"
    >
      <VaProgressCircle indeterminate size="large" color="primary" />
    </div>

    <div v-else class="text-center text-red-500 mt-6">
      No se pudo cargar la información del laboratorio.
    </div>

    <!-- Modal editar -->
    <VaModal
      v-model="isEditModalOpen"
      title="Editar laboratorio"
      ok-text="Guardar"
      cancel-text="Cancelar"
      size="small"
      @ok="submitEdit"
      close-button
      blur
    >
      <VaForm
        ref="editFormRef"
        class="space-y-3 flex flex-col justify-center items-center"
      >
        <VaInput
          v-model="editableForm.name"
          label="Nombre"
          required-mark
          :rules="[(v) => !!v || 'Requerido']"
          class="w-full"
        />
        <VaInput
          v-model="editableForm.rif"
          label="RIF"
          required-mark
          :rules="[(v) => !!v || 'Requerido']"
          class="w-full"
        />
        <VaTextarea
          v-model="editableForm.dir"
          label="Dirección"
          required-mark
          :rules="[(v) => !!v || 'Requerido']"
          class="w-full"
        />
        <VaInput
          v-model="editableForm.phoneNums"
          label="Teléfonos (separados por coma)"
          required-mark
          class="w-full"
        />
      </VaForm>
    </VaModal>

    <!-- Modal subir logo -->
    <VaModal
      v-model="isUploadModalOpen"
      title="Subir logo del laboratorio"
      ok-text="Subir"
      cancel-text="Cancelar"
      size="small"
      @ok="submitLogoUpload"
      close-button
      blur
    >
      <VaFileUpload
        v-model="selectedFile"
        type="single"
        dropzone
        file-types=".png, .svg"
        :max-size="5 * 1024 * 1024"
        class="w-full"
      />
      <small class="text-gray-500">
        Formato PNG o SVG, máximo 512x512 px y 5MB
      </small>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { labApi } from '@/services/api';
  import dayjs from 'dayjs';
  import { initToast } from '@/services/toast';
  import { useLabStore } from '@/stores/labStore';

  const loading = ref(true);
  const lab = ref<any>(null);
  const selectedFile = ref<File[]>([]);
  const isEditModalOpen = ref(false);
  const isUploadModalOpen = ref(false);
  const editFormRef = ref();

  const editableForm = reactive({
    name: '',
    rif: '',
    dir: '',
    phoneNums: '',
  });

  const formatDate = (dateStr: string) =>
    dayjs(dateStr).format('DD MMM YYYY HH:mm');

  const onEditLab = () => {
    if (!lab.value) return;
    editableForm.name = lab.value.name;
    editableForm.rif = lab.value.rif;
    editableForm.dir = lab.value.dir;
    editableForm.phoneNums = lab.value.phoneNums?.join(', ') ?? '';
    isEditModalOpen.value = true;
  };

  const submitEdit = async () => {
    const isValid = await editFormRef.value?.validate?.();
    if (!isValid) return;
    const updated = {
      ...editableForm,
      phoneNums: editableForm.phoneNums.split(',').map((p) => p.trim()),
    };
    try {
      //const res = await labApi.updateLab(lab.value.id, updated);
      //lab.value = res.data;
      initToast(
        'Laboratorio actualizado',
        'Cambios guardados correctamente',
        'success'
      );
      console.log('updated: ', updated);
    } catch (err) {
      console.error(err);
      initToast('Error', 'No se pudo actualizar', 'danger');
    }
  };

  const onOpenUpload = () => {
    selectedFile.value = [];
    isUploadModalOpen.value = true;
  };

  const submitLogoUpload = async () => {
    loading.value = true;
    const file = selectedFile.value?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      if (img.width > 512 || img.height > 512) {
        initToast('Error al subir', 'La imagen excede 512x512 px', 'warning');
        return;
      }
      try {
        const res = await labApi.uploadLogo(file);
        lab.value.logoPath = res.data.logoPath;
        useLabStore().setCurrentLab({ ...lab.value });
        initToast(
          'Logo actualizado',
          'Se subió el nuevo logo exitosamente',
          'success'
        );
      } catch (e) {
        console.error('Error al subir logo', e);
        initToast('Error', 'No se pudo subir el logo', 'danger');
      } finally {
        //URL.revokeObjectURL(url);
        loading.value = false;
      }
    };
    img.src = url;
  };

  onMounted(async () => {
    try {
      const res = await labApi.getDataLab();
      lab.value = res.data;
    } catch (e) {
      console.error('No se pudo cargar el laboratorio', e);
    } finally {
      loading.value = false;
    }
  });
</script>

<style scoped>
  .va-card {
    max-width: 600px;
    margin: auto;
  }
</style>
