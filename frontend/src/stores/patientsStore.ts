console.log('patientsStore.ts loaded');
import { defineStore } from 'pinia'
import { Patient } from '../pages/patients/patient.types' // Correct import path
import { useAuthStore } from './authStore' // For token
import { useLabStore } from './labStore' // For lab id

export const usePatientsStore = defineStore('patients', {
  state: () => ({
    items: [],
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
    },
  }),

  actions: {
    async getAll(options: { filters?: any; pagination?: any }) {
      console.log('patientsStore.ts getAll called', options);
      const authStore = useAuthStore()
      const labStore = useLabStore()
      const token = authStore.token
      const labId = labStore.currentLab?.id

      if (!token || !labId || isNaN(Number(labId))) {
        console.error('patientsStore: Missing or invalid authentication token or selected lab', { token, labId });
        throw new Error('Missing authentication token or selected lab')
      }

      const page = options.pagination?.page || 1
      const perPage = 20; // Force default to 20 as backend expects
      const offset = (page - 1) * perPage;
      const limit = perPage;

      // Always include all-data=true, offset, and limit
      const params = new URLSearchParams();
      params.append('all-data', 'true');
      params.append('offset', offset.toString());
      params.append('limit', limit.toString());

      const url = `https://biodesk.onrender.com/api/patients?${params.toString()}`;
      const headers = {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'x-lab-id': labId, // send as integer
      };
      console.log('patientsStore: Fetching patients', { url, headers });
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        let errorMsg = `Failed to fetch patients (status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg += `: ${JSON.stringify(errorData)}`;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json()
      this.items = data.data
      this.pagination = {
        page,
        perPage,
        total: data.total, 
      }

      return {
        data: this.items,
        pagination: this.pagination,
      }
    },

    async add(patient: Patient) {
      console.log('patientsStore.ts add called', patient);
      const authStore = useAuthStore()
      const labStore = useLabStore()
      const token = authStore.token
      const labId = labStore.currentLab?.id

      if (!token || !labId) {
        throw new Error('Missing authentication token or selected lab')
      }

      // Only send fields required by backend
      const patientPayload = {
        ci: patient.ci,
        name: patient.name,
        lastName: patient.lastName,
        secondName: patient.secondName,
        secondLastName: patient.secondLastName,
        gender: patient.gender,
        email: patient.email,
        dir: patient.dir,
        phoneNums: patient.phoneNums,
        birthDate: patient.birthDate,
      };
      console.log('Sending patient payload:', patientPayload)
      const headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-lab-id': labId.toString(),
      };
      const response = await fetch('https://biodesk.onrender.com/api/patients', {
        method: 'POST',
        headers,
        body: JSON.stringify(patientPayload),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to add patient';
        try {
          const errorData = await response.json();
          errorMsg += ': ' + JSON.stringify(errorData);
          console.error('Backend error response:', errorData);
        } catch (e) {
          console.error('Failed to parse backend error response');
        }
        throw new Error(errorMsg);
      }

      const data = await response.json()
      const newPatient = data.data // Use the correct key from backend
      this.items.unshift(newPatient)
      this.pagination.total++
      return newPatient
    },

    async update(updatedPatient: Patient): Promise<Patient> {
      const authStore = useAuthStore()
      const labStore = useLabStore()
      const token = authStore.token
      const labId = labStore.currentLab?.id

      if (!token || !labId) {
        throw new Error('Missing authentication token or selected lab')
      }

      const patientPayload = {
        ci: updatedPatient.ci,
        name: updatedPatient.name,
        lastName: updatedPatient.lastName,
        secondName: updatedPatient.secondName,
        secondLastName: updatedPatient.secondLastName,
        gender: updatedPatient.gender,
        email: updatedPatient.email,
        dir: updatedPatient.dir,
        phoneNums: updatedPatient.phoneNums,
        birthDate: updatedPatient.birthDate,
      };
      const response = await fetch(`https://biodesk.onrender.com/api/patients/${updatedPatient.id}`, {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-lab-id': labId.toString(),
        },
        body: JSON.stringify(patientPayload),
      })

      if (!response.ok) {
        throw new Error('Failed to update patient')
      }

      const data = await response.json()
      const patient = data.data // Use the correct key from backend
      const index = this.items.findIndex(p => p.id === patient.id)
      if (index !== -1) {
        this.items[index] = patient
      }
      return patient
    },

    async remove(patient: Patient) {
      const authStore = useAuthStore()
      const labStore = useLabStore()
      const token = authStore.token
      const labId = labStore.currentLab?.id

      if (!token || !labId) {
        throw new Error('Missing authentication token or selected lab')
      }

      const response = await fetch(`https://biodesk.onrender.com/api/patients/${patient.id}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-lab-id': labId.toString(),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete patient')
      }

      this.items = this.items.filter(p => p.id !== patient.id)
      this.pagination.total--
      return true
    },

    async uploadAvatar(formData: FormData) {
      // This method may need to be updated to use the backend if supported
      // Placeholder: implement as needed
      return { publicUrl: '' }
    },
  },
})
