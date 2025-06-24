<template>
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
    <VaButton @click="testGetDataLab"> Probar </VaButton>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useLabStore } from '@/stores/labStore';
  import { labApi, roleApi } from '@/services/api';
  import type { CreateRoleData } from '@/services/interfaces/role';

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

  async function testGetUserLabs() {
    try {
      const response = await labApi.getUserLabs();
      console.log('Labs del usuario:', response.data);
    } catch (error: any) {
      alert('Error al obtener labs: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetRoles() {
    try {
      const response = await roleApi.getRoles({
        offset: 0,
        limit: 10,
      });
      console.log(response.data);
    } catch (error: any) {
      alert('Error al obtener labs: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testCreateRole() {
    try {
      const data: CreateRoleData = {
        name: 'Personal2 de laboratorio',
        description:
          'Personal del laboratorio con permisos de lectura y actualización para gestionar RequestMedicTest',
        permissions: [
          {
            actions: ['read', 'update'],
            subject: 'RequestMedicTest',
            fields: ['state', 'results'],
          },
          {
            actions: ['read'],
            subject: 'Patient',
            fields: ['name', 'lastName', 'email'],
          },
        ],
      };
      const response = await roleApi.createRole(data);
      alert('Rol creado correctamente');
      console.log('Respuesta:', response?.data);
    } catch (error: any) {
      alert('Error al crear rol: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetRoleById() {
    try {
      const response = await roleApi.getRoleById('4');
      console.log('Rol encontrado:', response.data);
    } catch (error: any) {
      alert('Error al obtener el rol por su id: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testUpdateRole() {
    const data: Partial<CreateRoleData> = {
      name: 'Personal2 de laboraaa',
    };
    try {
      const response = await roleApi.updateRole('4', data);
      console.log('Rol actualizado:', response.data);
    } catch (error: any) {
      alert(
        'Error al actualizar el rol por su id: ' + (error.message || error)
      );
      console.error(error);
    }
  }

  async function testDeleteRole() {
    try {
      const response = await roleApi.deleteRole('4');
      console.log('rol eliminado:', response.data);
    } catch (error: any) {
      alert('Error al eliminar rol: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetRoleUsers() {
    try {
      const response = await roleApi.getRoleUsers('3', {
        offset: 0,
        limit: 10,
      });
      console.log('usuarios con el rol:', response.data);
    } catch (error: any) {
      alert('Error consultar usuarios con el rol: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetDataLab() {
    try {
      const response = await labApi.getDataLab();
      console.log('datos del lab actual:', response.data);
    } catch (error: any) {
      alert(
        'Error consultar datos del lab actual: ' + (error.message || error)
      );
      console.error(error);
    }
  }
</script>
