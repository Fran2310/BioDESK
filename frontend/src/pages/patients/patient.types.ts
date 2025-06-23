export type Patient = {
  id: number
  ci: string
  name: string
  lastName: string
  secondName?: string
  secondLastName?: string
  gender?:string
  email: string
  phoneNums: string[]
  dir: string
  birthDate: string
  medicHistory?: string|null
}
