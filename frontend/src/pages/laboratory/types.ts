export interface Exam {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // duration in minutes
  isAvailable: boolean;
}

export interface ExamCatalog {
  exams: Exam[];
  totalExams: number;
}

export interface MedicTestCatalog { // Medic Test catalog structure
  id: number
  name: string
  description?: string
  properties?: any
  supplies: string[]
  price: number
}

export interface NewExam {
  name: '',
  description: '',
  suppliesText: '',
  price: 0,
  propertiesText: '',
  }