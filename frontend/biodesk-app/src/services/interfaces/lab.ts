export interface LabData {
  id: number;
  name: string;
  status: 'active' | 'inactive';
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
