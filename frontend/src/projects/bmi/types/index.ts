// ===== frontend/src/projects/bmi/types/index.ts =====
export interface BMIInput {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female';
}

export interface BMIResult {
  bmi: number;
  category: string;
  categoryCode: string;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
  severity?: string;
  colorCode?: string;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  category_code: string;
  age?: number;
  gender?: string;
  is_healthy: boolean;
  who_classification: string;
  health_risks: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface BMIStatistics {
  totalRecords: number;
  averageBMI: number | null;
  latestBMI: number | null;
  latestCategory: string | null;
  lastCalculated: string | null;
  trend: string;
}

export interface BMIFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
}

// BMI 分類
export type BMICategory = 
  | 'severely_underweight' 
  | 'underweight' 
  | 'normal' 
  | 'overweight' 
  | 'obese_class1' 
  | 'obese_class2' 
  | 'obese_class3';

export interface BMIClassification {
  category: string;
  range: { min: number; max: number };
  description: string;
  healthRisks: string[];
  recommendations: string[];
  colorCode: string;
}
