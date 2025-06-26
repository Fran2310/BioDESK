<template>
  <RouterView />
  <div>
    <h1>Pruebas de LabApi</h1>
    <!-- Campo para setear el labId manualmente -->
    <VaInput v-model="labIdInput" label="Lab ID" class="mb-4" />
    <VaButton @click="setLabId">Setear Lab ID en Store</VaButton>

    <hr class="my-4" />

    <!-- Subida de logo -->
    <VaFileUpload
      v-model="logoFiles"
      type="gallery"
      dropzone
      file-types="svg,png"
      label="Subir logo del laboratorio"
      class="mb-4"
    />
    <VaButton @click="uploadLogo" :disabled="!logoFiles.length"
      >Subir Logo</VaButton
    >
    <VaButton @click="testDeleteMedicTestCatalog"> Probar </VaButton>
  </div>
</template>

<script setup lang="ts">
  import { labApi } from '@/services/api';
  import { useLabStore } from '@/stores/labStore';
  import { ref } from 'vue';
  import { testDeleteMedicTestCatalog } from '@/services/testApi';

  const labIdInput = ref('');
  const logoFiles = ref<File[]>([]);

  const labStore = useLabStore();

  function setLabId() {
    // Simula un currentLab en el store solo con el id
    labStore.currentLab = { id: labIdInput.value } as any;
    alert('Lab ID seteado en el store: ' + labIdInput.value);
  }

  async function uploadLogo() {
    if (!logoFiles.value.length) return;
    try {
      const file = logoFiles.value[0];
      const response = await labApi.uploadLogo(file);
      alert('Logo subido correctamente');
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      console.error(error);
    }
  }
</script>
