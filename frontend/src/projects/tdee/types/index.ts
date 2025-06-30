// ===== frontend/src/projects/tdee/types/index.ts =====
export interface TDEEInput {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  bmr_formula?: string;
  body_fat_percentage?: number;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: string;
    multiplier: number;
    description: string;
    name: string;
    chineseName?: string;
    intensity?: string;
  };
  macronutrients?: any;
  recommendations?: any;
  calorieGoals?: any;
  nutritionAdvice?: string[];
  bmrFormula?: string;
  metabolicAge?: number;
}

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
  activity_multiplier: number;
  macronutrients: any;
  recommendations: any;
  calorie_goals: any;
  nutrition_advice: string[];
  created_at: string;
  updated_at: string;
}

export interface TDEEStatistics {
  totalCalculations: number;
  latestTDEE: number | null;
  latestBMR: number | null;
  averageTDEE: number | null;
  mostUsedActivityLevel: string;
  lastCalculated: string | null;
  tdeeRange: { min: number; max: number } | null;
  bmrTrend: string;
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
  multiplier?: number;
}

export type ActivityLevelKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
