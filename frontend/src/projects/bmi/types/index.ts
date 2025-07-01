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
  categoryCode: string;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
  severity?: string;
  colorCode?: string;
}

export interface BMIFormData {
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: 'male' | 'female' | '';
}

// 添加缺失的類型
export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  age?: number;
  gender?: string;
  created_at: string;
}

export interface BMIStatistics {
  totalRecords: number;
  averageBMI: number;
  lastCategory: string;
  trend: 'up' | 'down' | 'stable';
}

// API 響應類型
export interface BMICalculationResponse {
  calculation: BMIResult;
  input: BMIInput;
  record: {
    id: string;
    created_at: string;
  };
}
