export type Gender = 'MALE' | 'FEMALE';

export type GenderValueRef = 'MALE' | 'FEMALE' | 'ANY';

export type AgeGroup = 'ADULT' | 'CHILD' | 'ANY';

export type ISODateString = string; // FORMATO ISO 8601

export type Status = 'active' | 'inactive';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type State =
  | 'PENDING'
  | 'IN_PROCESS'
  | 'TO_VERIFY'
  | 'CANCELED'
  | 'COMPLETED';
