// ===== frontend/src/projects/bmi/types/index.ts =====
export interface BMIInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
}

export interface BMIResult {
  bmi: number;
  category: string;
  category_cn: string;
}

export interface BMIFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
}