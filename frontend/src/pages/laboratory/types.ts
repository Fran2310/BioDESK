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