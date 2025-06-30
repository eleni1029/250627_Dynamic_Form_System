export const ACTIVITY_LEVELS = {
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
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;
export type Gender = 'male' | 'female';
export type BMRFormula = 'mifflin_st_jeor' | 'harris_benedict' | 'katch_mcardle';

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  bmr_formula?: BMRFormula;
  body_fat_percentage?: number; // 用於 Katch-McArdle 公式
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
  macronutrients?: MacronutrientBreakdown;
  recommendations?: TDEERecommendations;
  calorieGoals?: CalorieGoals;
  nutritionAdvice?: string[];
  bmrFormula: BMRFormula;
  metabolicAge?: number;
}

export interface MacronutrientBreakdown {
  protein: {
    calories: number;
    grams: number;
    percentage: number;
    gramPerKg: number;
    sources: string[];
  };
  fat: {
    calories: number;
    grams: number;
    percentage: number;
    gramPerKg: number;
    sources: string[];
  };
  carbs: {
    calories: number;
    grams: number;
    percentage: number;
    gramPerKg: number;
    sources: string[];
  };
  fiber: {
    grams: number;
    sources: string[];
  };
}

export interface CalorieGoals {
  maintenance: number;
  mildWeightLoss: number;      // -10%
  moderateWeightLoss: number;  // -20%
  aggressiveWeightLoss: number; // -25%
  mildWeightGain: number;      // +5%
  moderateWeightGain: number;  // +10%
  aggressiveWeightGain: number; // +15%
  extemeWeightLoss: number;    // -30% (需醫療監督)
  bulking: number;             // +20% (增肌期)
}

export interface TDEERecommendations {
  general: string[];
  activity: string[];
  nutrition: string[];
  hydration: string[];
  recovery: string[];
  warnings: string[];
  supplementation?: string[];
}

export interface TDEETrend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  changePercent: number;
  timeframe: string;
  bmrTrend: 'improving' | 'declining' | 'stable';
  activityTrend: 'more_active' | 'less_active' | 'consistent';
}

export interface TDEEStatistics {
  totalCalculations: number;
  averageTDEE: number | null;
  averageBMR: number | null;
  minTDEE: number | null;
  maxTDEE: number | null;
  mostUsedActivityLevel: ActivityLevel;
  activityDistribution: Record<string, number>;
  tdeeRange: { min: number; max: number } | null;
  bmrTrend: TDEETrend;
  lastCalculated: Date | null;
  metabolicEfficiency: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

// 年齡分組的BMR修正係數
export const AGE_BMR_ADJUSTMENTS = {
  child: { min: 1, max: 12, adjustment: 1.15, note: '兒童代謝較快，生長發育需要' },
  teen: { min: 13, max: 19, adjustment: 1.08, note: '青少年代謝較快，激素影響' },
  young_adult: { min: 20, max: 29, adjustment: 1.02, note: '年輕成人代謝率較高' },
  adult: { min: 30, max: 39, adjustment: 1.0, note: '成年人基準代謝率' },
  middle_age: { min: 40, max: 49, adjustment: 0.98, note: '中年代謝開始放緩' },
  mature: { min: 50, max: 59, adjustment: 0.95, note: '成熟期代謝明顯放緩' },
  senior: { min: 60, max: 69, adjustment: 0.92, note: '老年代謝顯著下降' },
  elderly: { min: 70, max: 150, adjustment: 0.88, note: '高齡代謝率最低' }
};

// 性別特定的營養建議
export const GENDER_SPECIFIC_NUTRITION = {
  male: {
    protein: { min: 1.2, max: 2.2, unit: 'g/kg', optimal: 1.6 },
    fiber: { daily: 38, unit: 'g' },
    water: { daily: 3.7, unit: 'L', perKg: 35 },
    calories: { baseMultiplier: 1.0 },
    specificNeeds: ['鋅 (15mg)', '維生素D (15μg)', 'Omega-3 (1.6g)', '鎂 (400mg)'],
    restrictions: ['適量飲酒', '控制飽和脂肪'],
    metabolicFeatures: ['較高肌肉量', '較快代謝率', '較低體脂率']
  },
  female: {
    protein: { min: 1.0, max: 2.0, unit: 'g/kg', optimal: 1.4 },
    fiber: { daily: 25, unit: 'g' },
    water: { daily: 2.7, unit: 'L', perKg: 30 },
    calories: { baseMultiplier: 0.85 },
    specificNeeds: ['鐵 (18mg)', '葉酸 (400μg)', '鈣 (1000mg)', '維生素D (15μg)'],
    restrictions: ['限制咖啡因', '避免過度節食'],
    metabolicFeatures: ['月經週期影響', '較高體脂率', '雌激素影響代謝'],
    cycleConsiderations: {
      follicular: '代謝率較低，適合高強度訓練',
      luteal: '代謝率較高，需要更多熱量',
      menstrual: '鐵質需求增加，注意補充'
    }
  }
};

// BMR 計算公式
export const BMR_FORMULAS = {
  mifflin_st_jeor: {
    name: 'Mifflin-St Jeor',
    description: '最準確的現代公式，適用於大多數人',
    accuracy: 'high',
    male: (weight: number, height: number, age: number) => 
      88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age),
    female: (weight: number, height: number, age: number) => 
      447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  },
  harris_benedict: {
    name: 'Harris-Benedict (Revised)',
    description: '經典公式，略高估代謝率',
    accuracy: 'moderate',
    male: (weight: number, height: number, age: number) => 
      88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age),
    female: (weight: number, height: number, age: number) => 
      447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  },
  katch_mcardle: {
    name: 'Katch-McArdle',
    description: '基於瘦體重，需要體脂率數據',
    accuracy: 'very_high',
    formula: (leanBodyMass: number) => 370 + (21.6 * leanBodyMass)
  }
};

// 運動類型對TDEE的影響
export const EXERCISE_IMPACT = {
  cardio: {
    light: { caloriesPerHour: 300, examples: ['散步', '慢速游泳'] },
    moderate: { caloriesPerHour: 500, examples: ['慢跑', '騎自行車'] },
    vigorous: { caloriesPerHour: 700, examples: ['快跑', '高強度間歇'] }
  },
  strength: {
    light: { caloriesPerHour: 200, examples: ['輕重量訓練', '皮拉提斯'] },
    moderate: { caloriesPerHour: 350, examples: ['重量訓練', 'CrossFit'] },
    vigorous: { caloriesPerHour: 450, examples: ['重量競技', '功能性訓練'] }
  },
  sports: {
    recreational: { caloriesPerHour: 400, examples: ['網球', '籃球', '足球'] },
    competitive: { caloriesPerHour: 600, examples: ['比賽級運動', '專業訓練'] }
  }
};

export function calculateBMR(
  height: number, 
  weight: number, 
  age: number, 
  gender: Gender, 
  formula: BMRFormula = 'mifflin_st_jeor',
  bodyFatPercentage?: number
): number {
  switch (formula) {
    case 'mifflin_st_jeor':
      return BMR_FORMULAS.mifflin_st_jeor[gender](weight, height, age);
    
    case 'harris_benedict':
      return BMR_FORMULAS.harris_benedict[gender](weight, height, age);
    
    case 'katch_mcardle':
      if (!bodyFatPercentage) {
        throw new Error('Body fat percentage required for Katch-McArdle formula');
      }
      const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
      return BMR_FORMULAS.katch_mcardle.formula(leanBodyMass);
    
    default:
      return BMR_FORMULAS.mifflin_st_jeor[gender](weight, height, age);
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_LEVELS[activityLevel].multiplier;
}

export function getActivityLevelInfo(level: ActivityLevel) {
  return ACTIVITY_LEVELS[level];
}

export function calculateMetabolicAge(bmr: number, actualAge:
