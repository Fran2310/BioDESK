import type { PatientData } from '@/services/interfaces/patient'

// Patient type as returned from the API, includes id
export type Patient = PatientData & { id: string | number }

// Patient type with medical history (for detail views)
export type PatientWithHistoryId = Patient & { medicHistoryId: any }
