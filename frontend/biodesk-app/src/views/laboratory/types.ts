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
export interface ReferenceVariation {
  range: string;
  gender: string;
  ageGroup: string;
}
export interface ReferenceProperty {
  name: string;
  unit: string;
  variations: ReferenceVariation[];
}
export interface RemoveVariationFn {
  (referenceIndex: number, variationIndex: number): void;
}