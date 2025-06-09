export type Patient = {
  id: number
  ci: string
  name: string
  lastName: string
  secondName?: string
  secondLastName?: string
  email: string
  phoneNums: string[]
  dir: string
  birthDate: string
  notes?: string
  active?: boolean // Optional, but useful for soft-deletion or status filtering
  medicHistory?: string|null
}