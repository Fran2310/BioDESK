import type { Gender, ISODateString } from '../types/global.type';

export interface PatientData {
  ci: string;
  name: string;
  lastName: string;
  secondName?: string;
  secondLastName?: string;
  gender: Gender;
  email: string;
  dir: string;
  phoneNums: string[];
  birthDate: ISODateString;
}
