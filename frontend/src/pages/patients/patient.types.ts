export type Patient = {
  id: UUID
  ci: string
  name: string
  lastName: string
  secondName?: string
  secondLastName?: string
  email: string
  phoneNums: string[]
  dir: string
  birthDate: string
  avatar: string
  notes: string
  active: boolean // Optional, but useful for soft-deletion or status filtering
}