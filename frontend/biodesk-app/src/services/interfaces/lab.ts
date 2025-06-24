import type { Status } from '../types/global.type';

export interface LabData {
  id: number;
  name: string;
  status: Status;
  rif: string;
}

export interface LabsUserData {
  labs: LabData[];
  currentLab: LabData | null;
}

export interface RegisterLabData {
  name: string;
  rif: string;
  dir: string;
  phoneNums: string[];
}
