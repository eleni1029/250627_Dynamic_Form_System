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
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
    chineseName?: string;
    intensity?: string;
  };
  weightGoal?: {
    maintain: number;
    mildLoss: number;
    moderateLoss: number;
    aggressiveLoss: number;
    mildGain: number;
    moderateGain: number;
  };
  metabolicAge?: number;
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

// 添加缺失的類型
export interface TDEERecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr: number;
  tdee: number;
  activity_factor: number;
  created_at: string;
}

export interface TDEEStatistics {
  totalRecords: number;
  averageTDEE: number;
  averageBMR: number;
  mostCommonActivityLevel: string;
  trend: 'up' | 'down' | 'stable';
}

// API 響應類型
export interface TDEECalculationResponse {
  calculation: TDEEResult;
  input: TDEEInput;
  record: {
    id: string;
    created_at: string;
  };
}
