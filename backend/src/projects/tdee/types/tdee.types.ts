export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type BMRFormula = 'mifflin_st_jeor' | 'harris_benedict' | 'katch_mcardle';

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  bmr_formula?: BMRFormula;
  body_fat_percentage?: number;
}

export interface TDEECalculationResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: ActivityLevel;
    multiplier: number;
    description: string;
    name: string;
    chineseName: string;
    intensity: string;
  };
  macronutrients?: any;
  recommendations?: any;
  calorieGoals?: any;
  nutritionAdvice?: string[];
  bmrFormula: BMRFormula;
  metabolicAge?: number;
}

export interface ActivityLevelInfo {
  multiplier: number;
  description: string;
  name: string;
  chineseName: string;
  examples: string[];
  calorieRange: string;
  exerciseHours: string;
  intensity: string;
  recommendation: string;
}

export const ACTIVITY_LEVELS: Record<ActivityLevel, ActivityLevelInfo> = {
  sedentary: {
    multiplier: 1.2,
    description: 'Little or no exercise, desk job',
    name: 'Sedentary',
    chineseName: '久坐不動',
    examples: ['辦公室工作', '很少運動', '主要坐著或躺著', '每天步行少於30分鐘'],
    calorieRange: '基礎代謝率 × 1.2',
    exerciseHours: '0-1 小時/週',
    intensity: 'minimal',
    recommendation: '建議增加日常活動量'
  },
  light: {
    multiplier: 1.375,
    description: 'Light exercise/sports 1-3 days/week',
    name: 'Lightly Active',
    chineseName: '輕度活動',
    examples: ['每週1-3次輕度運動', '散步', '輕度家務', '瑜伽', '太極'],
    calorieRange: '基礎代謝率 × 1.375',
    exerciseHours: '1-3 小時/週',
    intensity: 'light',
    recommendation: '保持當前活動水平，可考慮增加運動強度'
  },
  moderate: {
    multiplier: 1.55,
    description: 'Moderate exercise/sports 3-5 days/week',
    name: 'Moderately Active',
    chineseName: '中度活動',
    examples: ['每週3-5次中度運動', '游泳', '騎自行車', '重量訓練', '跑步'],
    calorieRange: '基礎代謝率 × 1.55',
    exerciseHours: '3-5 小時/週',
    intensity: 'moderate',
    recommendation: '良好的活動水平，建議維持規律運動'
  },
  active: {
    multiplier: 1.725,
    description: 'Hard exercise/sports 6-7 days a week',
    name: 'Very Active',
    chineseName: '積極活動',
    examples: ['每週6-7次劇烈運動', '跑步', '競技運動', '高強度訓練', '登山'],
    calorieRange: '基礎代謝率 × 1.725',
    exerciseHours: '6-10 小時/週',
    intensity: 'vigorous',
    recommendation: '優秀的活動水平，注意適度休息和恢復'
  },
  very_active: {
    multiplier: 1.9,
    description: 'Very hard exercise/sports & physical job',
    name: 'Extra Active',
    chineseName: '非常活躍',
    examples: ['極高強度運動', '體力勞動工作', '一天兩次訓練', '馬拉松訓練', '職業運動員'],
    calorieRange: '基礎代謝率 × 1.9',
    exerciseHours: '10+ 小時/週',
    intensity: 'extreme',
    recommendation: '極高活動水平，確保充足營養攝取和休息'
  }
};

export interface TDEEStatistics {
  totalCalculations: number;
  averageTDEE: number | null;
  averageBMR: number | null;
  minTDEE: number | null;
  maxTDEE: number | null;
  mostUsedActivityLevel: ActivityLevel;
  activityDistribution: Record<string, number>;
  tdeeRange: { min: number; max: number } | null;
  bmrTrend: string;
  lastCalculated: Date | null;
  metabolicEfficiency: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

export interface TDEEValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export function getActivityLevelInfo(level: ActivityLevel): ActivityLevelInfo | undefined {
  return ACTIVITY_LEVELS[level];
}

export function validateActivityLevel(level: string): level is ActivityLevel {
  return Object.keys(ACTIVITY_LEVELS).includes(level);
}

export function calculateBMR(
  height: number, 
  weight: number, 
  age: number, 
  gender: Gender, 
  formula: BMRFormula = 'mifflin_st_jeor'
): number {
  switch (formula) {
    case 'mifflin_st_jeor':
      if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    case 'harris_benedict':
      if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    default:
      return 0;
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const activityInfo = ACTIVITY_LEVELS[activityLevel];
  return bmr * activityInfo.multiplier;
}

export function validateTDEEInput(request: TDEECalculationRequest): TDEEValidation {
  const errors: string[] = [];

  if (!request.height || request.height < 50 || request.height > 300) {
    errors.push('身高必須在 50-300cm 之間');
  }

  if (!request.weight || request.weight < 10 || request.weight > 500) {
    errors.push('體重必須在 10-500kg 之間');
  }

  if (!request.age || request.age < 1 || request.age > 150) {
    errors.push('年齡必須在 1-150 歲之間');
  }

  if (!request.gender || !['male', 'female'].includes(request.gender)) {
    errors.push('性別必須是 male 或 female');
  }

  if (!request.activity_level || !ACTIVITY_LEVELS[request.activity_level]) {
    errors.push('必須選擇有效的活動等級');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
