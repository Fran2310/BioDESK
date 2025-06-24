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
    <VaButton @click="testGetPatientWithMedicHistory"> Probar </VaButton>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useLabStore } from '@/stores/labStore';
  import {
    labApi,
    medicHistoryApi,
    patientApi,
    roleApi,
    userApi,
  } from '@/services/api';
  import type { CreateRoleData } from '@/services/interfaces/role';
  import type { MedicHistoryData } from '@/services/interfaces/medicHistory';
  import type { PatientData } from '@/services/interfaces/patient';

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

  async function testCreatePatient() {
    try {
      const data: PatientData = {
        ci: 'v22345678',
        name: 'pepillo',
        lastName: 'Ripper',
        secondName: 'Pedrolo',
        secondLastName: 'Pa',
        gender: 'MALE',
        email: 'pepillo@example.com',
        dir: 'Av. Principal #123',
        phoneNums: ['04121234567', '02121234567'],
        birthDate: new Date().toISOString(), // Fecha actual en formato ISO 8601
      };
      const response = await patientApi.createPatient(data);
      alert('Paciente creado correctamente');
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      alert('Error al crear paciente: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetPatientById() {
    try {
      // Cambia el ID por uno válido en tu base de datos
      const response = await patientApi.getPatientById('10');
      console.log('Paciente encontrado:', response.data);
      alert('Consulta exitosa, revisa la consola.');
    } catch (error: any) {
      alert('Error al obtener paciente por ID: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testGetPatients() {
    try {
      const response = await patientApi.getPatients({
        offset: 0,
        limit: 10,
        includeData: false, // Obligatorio
      });
      console.log('Pacientes encontrados:', response.data);
      alert('Consulta exitosa, revisa la consola.');
    } catch (error: any) {
      alert('Error al obtener pacientes: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testUpdatePatient() {
    try {
      // Cambia el ID por uno válido y los campos que quieras actualizar
      const response = await patientApi.updatePatient('11', {
        name: 'pepillote',
        email: 'nuevopepillote@example.com',
      });
      alert('Paciente actualizado correctamente');
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      alert('Error al actualizar paciente: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testDeletePatient() {
    try {
      // Cambia el ID por uno válido
      const response = await patientApi.deletePatient('11');
      alert('Paciente eliminado correctamente');
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      alert('Error al eliminar paciente: ' + (error.message || error));
      console.error(error);
    }
  }

  async function testUpdateMedicHistory() {
    try {
      const data: MedicHistoryData = {
        allergies: ['penicilina', 'acetaminofen'],
      };
      const response = await medicHistoryApi.updateMedicHistory('10', data);
      alert(
        'Revisar consola para datos del historial medico del paciente actualizado'
      );
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      alert(
        'Error al actualizar datos del historial medico del paciente' +
          (error.message || error)
      );
      console.error(error);
    }
  }

  async function testGetPatientWithMedicHistory() {
    try {
      const response = await patientApi.getPatientWithMedicHistory('10', true);
      alert('Revisar consola para datos del paciente con historial medico');
      console.log('Respuesta:', response);
    } catch (error: any) {
      alert(
        'Error al consultar datos del paciente con historial medico' +
          (error.message || error)
      );
      console.error(error);
    }
  }

  async function testgetMe() {
    try {
      const response = await userApi.getMe();
      alert('Revisar consola para datos del usuario actual');
      console.log('Respuesta:', response.data);
    } catch (error: any) {
      alert(
        'Error al consultar datos del usuario actual, inicie sesion: ' +
          (error.message || error)
      );
      console.error(error);
    }
  }
</script>
