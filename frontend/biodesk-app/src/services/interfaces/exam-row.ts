import { Priority, State } from "../types/global.type";
import { CreateMedicTestRequestData } from "./medicTestRequest";

export interface ExamRow
  extends Omit<CreateMedicTestRequestData, 'resultProperties'> {
  id: number;
  requestedAt: string;
  completedAt?: string;
  state: State;
  priority: Priority;
  resultProperties: Record<string, string>;
  observation: string;
  byLabUserId: number | null;
  medicTestCatalogId: number;
  medicTestCatalog: {
    id: number;
    name: string;
    description: string;
    price: number;
    supplies: string[];
  };
  medicHistory: {
    id: number;
    patientId: number;
    patient: {
      id: number;
      ci: string;
      name: string;
      lastName: string;
      secondName: string;
      secondLastName: string;
      gender: string;
      email: string;
      phoneNums: string[];
      dir: string;
      birthDate: string;
    };
  };
}

export const stateLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROCESS: 'En proceso',
  COMPLETED: 'Completado',
  TO_VERIFY: 'Por verificar',
  CANCELED: 'Cancelado',
};

export const priorityLabels: Record<string, string> = {
HIGH: 'Alta',
MEDIUM: 'Media',
LOW: 'Baja',
};

export function priorityColor(priority: string) {
switch (priority?.toUpperCase()) {
  case 'HIGH':
    return 'danger';
  case 'MEDIUM':
    return 'warning';
  case 'LOW':
    return 'success';
  default:
    return 'info';
}
}

export function stateColor(state: string) {
  switch (state?.toUpperCase()) {
    case 'PENDING':
      return 'warning';
    case 'TO_VERIFY':
      return 'info';
    case 'COMPLETED':
      return 'success';
    case 'CANCELED':
      return 'danger';
    default:
      return 'info';
  }
}


export function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}