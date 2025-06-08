// /src/data/mock-patients.ts

import { Patient } from '@/pages/patients/types'

export const mockPatients: Patient[] = [
  {
    id: '1',
    ci: '12345678',
    name: 'John',
    lastName: 'Doe',
    secondName: '',
    secondLastName: '',
    email: 'john@example.com',
    phoneNums: ['+123456789'],
    dir: 'Main St.',
    birthDate: '1990-01-01',
    avatar: '',
    notes: '',
    active: true,
  },
  {
    id: '2',
    ci: '87654321',
    name: 'Jane',
    lastName: 'Smith',
    secondName: 'Marie',
    secondLastName: 'Johnson',
    email: 'jane.smith@example.com',
    phoneNums: ['+987654321', '+555555555'],
    dir: 'Elm Street',
    birthDate: '1985-05-10',
    avatar: '',
    notes: 'Allergic to penicillin',
    active: true,
  }
]