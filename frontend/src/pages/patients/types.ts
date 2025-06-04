export type UserRole = 'admin' | 'user' | 'owner'

export type UUID = `${string}-${string}-${string}-${string}-${string}`

export type User = {
  id: UUID
  ci: string
  name: string
  lastName: string
  secondName: string
  secondLastName: string
  email: string
  username: string
  phoneNums: string[]
  dir: string
  birthDate: string
  role: UserRole
  avatar: string
  notes: string
  active: boolean
}
