// /src/data/mock-patients.ts

import { Patient } from '@/pages/patients/types'

const getRandomDate = (startYear = 1950, endYear = 2005) => {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const names = [
  ['John', 'Doe'],
  ['Jane', 'Smith'],
  ['Robert', 'Johnson'],
  ['Michael', 'Williams'],
  ['William', 'Brown'],
  ['David', 'Jones'],
  ['Richard', 'Garcia'],
  ['Joseph', 'Miller'],
  ['Thomas', 'Davis'],
  ['Charles', 'Rodriguez'],
  ['Daniel', 'Martinez'],
  ['Matthew', 'Hernandez'],
  ['Anthony', 'Lopez'],
  ['Mark', 'Gonzalez'],
  ['Donald', 'Wilson'],
  ['Steven', 'Anderson'],
  ['Paul', 'Taylor'],
  ['Andrew', 'Moore'],
  ['Joshua', 'Jackson'],
  ['Kenneth', 'Martin']
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young'
]

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateCI(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000))
}

function generatePhoneNumbers(): string[] {
  const count = Math.random() > 0.7 ? 2 : 1
  const phones = []
  for (let i = 0; i < count; i++) {
    phones.push('+1' + Math.floor(1000000000 + Math.random() * 9000000000))
  }
  return phones
}

export const mockPatients: Patient[] = Array.from({ length: 40 }).map((_, index) => {
  const firstName = randomFromArray(names)[0]
  const lastName = randomFromArray(names)[1] || randomFromArray(lastNames)
  const secondName = Math.random() > 0.6 ? randomFromArray(names)[0] : ''
  const secondLastName = Math.random() > 0.6 ? randomFromArray(lastNames) : ''

  return {
    id: index + 1,
    ci: generateCI(),
    name: firstName,
    lastName,
    secondName,
    secondLastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phoneNums: generatePhoneNumbers(),
    dir: `${Math.floor(100 + Math.random() * 900)} ${randomFromArray(['Main St', 'Elm St', 'Oak Ave', 'Pine Rd', 'Maple Dr'])}, Cityville`,
    birthDate: getRandomDate(1940, 2005),
    active: Math.random() > 0.2, // 80% active
  }
})