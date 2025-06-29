// ===== frontend/src/projects/tdee/types/index.ts =====
export interface TDEEInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activity_factor: number;
}

export interface TDEEFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
  activity_level: string;
}

export interface ActivityLevel {
  value: string;
  label: string;
  description?: string;
}