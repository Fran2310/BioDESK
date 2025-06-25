import {
  labApi,
  medicHistoryApi,
  patientApi,
  roleApi,
  userApi,
  medicTestCatalogApi,
} from '@/services/api';
import type { CreateRoleData } from '@/services/interfaces/role';
import type { MedicHistoryData } from '@/services/interfaces/medicHistory';
import type { PatientData } from '@/services/interfaces/patient';
import type { CreateMedicTestCatalogData } from '@/services/interfaces/medicTestCatalog';
import type { GetExtendQuerys } from '@/services/interfaces/global';

export async function testGetUserLabs() {
  try {
    const response = await labApi.getUserLabs();
    console.log('Labs del usuario:', response.data);
  } catch (error: any) {
    alert('Error al obtener labs: ' + (error.message || error));
    console.error(error);
  }
}

export async function testGetRoles() {
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

export async function testCreateRole() {
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

export async function testGetRoleById() {
  try {
    const response = await roleApi.getRoleById('4');
    console.log('Rol encontrado:', response.data);
  } catch (error: any) {
    alert('Error al obtener el rol por su id: ' + (error.message || error));
    console.error(error);
  }
}

export async function testUpdateRole() {
  const data: Partial<CreateRoleData> = {
    name: 'Personal2 de laboraaa',
  };
  try {
    const response = await roleApi.updateRole('4', data);
    console.log('Rol actualizado:', response.data);
  } catch (error: any) {
    alert('Error al actualizar el rol por su id: ' + (error.message || error));
    console.error(error);
  }
}

export async function testDeleteRole() {
  try {
    const response = await roleApi.deleteRole('4');
    console.log('rol eliminado:', response.data);
  } catch (error: any) {
    alert('Error al eliminar rol: ' + (error.message || error));
    console.error(error);
  }
}

export async function testGetRoleUsers() {
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

export async function testGetDataLab() {
  try {
    const response = await labApi.getDataLab();
    console.log('datos del lab actual:', response.data);
  } catch (error: any) {
    alert('Error consultar datos del lab actual: ' + (error.message || error));
    console.error(error);
  }
}

export async function testCreatePatient() {
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

export async function testGetPatientById() {
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

export async function testGetPatients() {
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

export async function testUpdatePatient() {
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

export async function testDeletePatient() {
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

export async function testUpdateMedicHistory() {
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

export async function testGetPatientWithMedicHistory() {
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

/**
 * Test para obtener el catálogo general de pruebas médicas.
 */
export async function testGetMedicTestCatalog() {
  try {
    const query: GetExtendQuerys = {
      offset: 0,
      limit: 10,
      includeData: true,
      // Puedes agregar search-fields y search-term si lo necesitas
      // 'search-fields': ['name'],
      // 'search-term': 'hemo',
    };
    const response = await medicTestCatalogApi.getMedicTestCatalog(query);
    alert(
      'Consulta exitosa, revisa la consola para el catálogo de pruebas médicas.'
    );
    console.log('Catálogo de pruebas médicas:', response.data);
  } catch (error: any) {
    alert(
      'Error al obtener el catálogo de pruebas médicas: ' +
        (error.message || error)
    );
    console.error(error);
  }
}

/**
 * Test para obtener un examen médico específico por su ID.
 */
export async function testGetMedicTestCatalogById() {
  try {
    // Cambia el ID por uno válido en tu base de datos
    const id = '2';
    const includeData = true;
    const response = await medicTestCatalogApi.getMedicTestCatalogById(
      id,
      includeData
    );
    alert('Consulta exitosa, revisa la consola para el examen médico.');
    console.log('Examen médico encontrado:', response.data);
  } catch (error: any) {
    alert(
      'Error al obtener el examen médico por ID: ' + (error.message || error)
    );
    console.error(error);
  }
}

/**
 * Test para crear un nuevo examen médico en el catálogo.
 */
export async function testCreateMedicTestCatalog() {
  try {
    const data: CreateMedicTestCatalogData = {
      name: 'Hemogramus',
      description: 'Análisis de sangre para evaluar hematocritos',
      price: 15,
      supplies: ['Tubo EDTA', 'Guantes'],
      properties: [
        {
          name: 'Hematocrito',
          unit: '%',
          valueReferences: [
            {
              range: '36.0 - 48.6',
              gender: 'ANY',
              ageGroup: 'ADULT',
            },
          ],
        },
      ],
    };
    const response = await medicTestCatalogApi.createMedicTestCatalog(data);
    alert(
      'Examen médico creado correctamente. Revisa la consola para la respuesta.'
    );
    console.log('Respuesta:', response.data);
  } catch (error: any) {
    alert('Error al crear el examen médico: ' + (error.message || error));
    console.error(error);
  }
}

/**
 * Test para eliminar un examen médico del catálogo por su ID.
 */
export async function testDeleteMedicTestCatalog() {
  try {
    // Cambia el ID por uno válido en tu base de datos
    const id = '2';
    const response = await medicTestCatalogApi.deleteMedicTestCatalog(id);
    alert(
      'Examen médico eliminado correctamente. Revisa la consola para la respuesta.'
    );
    console.log('Respuesta:', response.data);
  } catch (error: any) {
    alert('Error al eliminar el examen médico: ' + (error.message || error));
    console.error(error);
  }
}

/**
 * Test para actualizar un examen médico existente en el catálogo.
 */
export async function testPutMedicTestCatalog() {
  try {
    // Cambia el ID por uno válido en tu base de datos
    const id = '3';
    const data: CreateMedicTestCatalogData = {
      name: 'Hemograma Actualizadus',
      description: 'Análisis de sangre actualizado para evaluar hematocritos',
      price: 20,
      supplies: ['Tubo EDTA', 'Guantes', 'Alcohol'],
      properties: [
        {
          name: 'Hematocrito',
          unit: '%',
          valueReferences: [
            {
              range: '36.0 - 48.6',
              gender: 'ANY',
              ageGroup: 'ADULT',
            },
          ],
        },
        {
          name: 'Hemoglobina',
          unit: 'g/dL',
          valueReferences: [
            {
              range: '12.0 - 16.0',
              gender: 'FEMALE',
              ageGroup: 'ADULT',
            },
            {
              range: '14.0 - 18.0',
              gender: 'MALE',
              ageGroup: 'ADULT',
            },
          ],
        },
      ],
    };
    const response = await medicTestCatalogApi.putMedicTestCatalog(id, data);
    alert(
      'Examen médico actualizado correctamente. Revisa la consola para la respuesta.'
    );
    console.log('Respuesta:', response.data);
  } catch (error: any) {
    alert('Error al actualizar el examen médico: ' + (error.message || error));
    console.error(error);
  }
}

export async function testgetMe() {
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
