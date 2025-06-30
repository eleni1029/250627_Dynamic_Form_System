#!/bin/bash

echo "🔧 模組化修復 Part 3-1 - BMI 類型定義"
echo "===================================="

# ===== BMI 類型定義 =====
echo "📝 創建 BMI 類型定義..."

cat > backend/src/projects/bmi/types/bmi.types.ts << 'EOF'
export interface BMIClassification {
  category: string;
  range: {
    min: number;
    max: number;
  };
  description: string;
  healthRisks: string[];
  recommendations: string[];
  colorCode: string;
  severity: 'low' | 'normal' | 'moderate' | 'high' | 'very_high';
}

export const BMI_CLASSIFICATIONS: Record<string, BMIClassification> = {
  severely_underweight: {
    category: 'Severely Underweight',
    range: { min: 0, max: 16 },
    description: 'Severely below normal weight - immediate medical attention required',
    healthRisks: [
      '嚴重營養不良風險',
      '免疫系統嚴重受損',
      '器官功能衰竭風險',
      '生命危險',
      '骨質嚴重流失'
    ],
    recommendations: [
      '立即就醫治療',
      '專業營養師指導',
      '醫療監督下增重',
      '心理健康評估',
      '定期健康檢查'
    ],
    colorCode: '#8B0000',
    severity: 'very_high'
  },
  underweight: {
    category: 'Underweight',
    range: { min: 16, max: 18.5 },
    description: 'Below normal weight',
    healthRisks: [
      '營養不良風險',
      '免疫力下降',
      '骨密度降低',
      '生育能力問題',
      '傷口癒合緩慢',
      '貧血風險'
    ],
    recommendations: [
      '增加健康熱量攝取',
      '諮詢營養師制定增重計畫',
      '進行適度的重量訓練',
      '定期監測體重變化',
      '增加蛋白質攝取',
      '考慮營養補充劑'
    ],
    colorCode: '#4169E1',
    severity: 'moderate'
  },
  normal: {
    category: 'Normal weight',
    range: { min: 18.5, max: 25 },
    description: 'Healthy weight range',
    healthRisks: [
      '健康風險較低',
      '最佳健康狀態'
    ],
    recommendations: [
      '維持均衡飲食',
      '保持規律運動',
      '定期健康檢查',
      '維持健康的生活方式',
      '控制壓力水平',
      '充足睡眠'
    ],
    colorCode: '#228B22',
    severity: 'low'
  },
  overweight: {
    category: 'Overweight',
    range: { min: 25, max: 30 },
    description: 'Above normal weight',
    healthRisks: [
      '心血管疾病風險增加',
      '2型糖尿病風險',
      '高血壓風險',
      '睡眠呼吸中止症風險',
      '關節問題',
      '膽固醇異常'
    ],
    recommendations: [
      '控制熱量攝取',
      '增加運動頻率和強度',
      '諮詢營養師制定減重計畫',
      '設定合理的減重目標',
      '改善飲食習慣',
      '增加有氧運動'
    ],
    colorCode: '#FF8C00',
    severity: 'moderate'
  },
  obese_class1: {
    category: 'Obese Class I',
    range: { min: 30, max: 35 },
    description: 'Moderately obese',
    healthRisks: [
      '嚴重心血管疾病風險',
      '2型糖尿病高風險',
      '睡眠呼吸中止症',
      '某些癌症風險增加',
      '關節炎和關節問題',
      '膽囊疾病',
      '脂肪肝'
    ],
    recommendations: [
      '諮詢醫生制定綜合減重計畫',
      '採用低熱量、均衡飲食',
      '進行適合的有氧運動',
      '考慮專業醫療介入',
      '定期監測健康指標',
      '心理支持和諮商'
    ],
    colorCode: '#FF4500',
    severity: 'high'
  },
  obese_class2: {
    category: 'Obese Class II',
    range: { min: 35, max: 40 },
    description: 'Severely obese',
    healthRisks: [
      '極高心血管疾病風險',
      '糖尿病併發症風險',
      '嚴重睡眠呼吸中止症',
      '多種癌症風險',
      '嚴重關節問題',
      '心臟衰竭風險',
      '中風風險增加'
    ],
    recommendations: [
      '立即尋求醫療協助',
      '考慮減重手術評估',
      '嚴格醫療監督',
      '多學科治療團隊',
      '心理健康支持',
      '家庭支持系統'
    ],
    colorCode: '#DC143C',
    severity: 'very_high'
  },
  obese_class3: {
    category: 'Obese Class III',
    range: { min: 40, max: 999 },
    description: 'Morbidly obese - highest health risk category',
    healthRisks: [
      '生命威脅性健康風險',
      '嚴重心血管併發症',
      '多器官系統衰竭風險',
      '嚴重糖尿病併發症',
      '呼吸系統嚴重問題',
      '移動能力嚴重受限',
      '預期壽命顯著縮短'
    ],
    recommendations: [
      '緊急醫療介入',
      '減重手術評估',
      '重症醫學監護',
      '全面醫療團隊治療',
      '緊急心理支持',
      '長期醫療追蹤'
    ],
    colorCode: '#8B0000',
    severity: 'very_high'
  }
};

export type BMICategory = keyof typeof BMI_CLASSIFICATIONS;
export type Gender = 'male' | 'female';
export type BMISeverity = 'low' | 'normal' | 'moderate' | 'high' | 'very_high';

export interface BMIMetrics {
  bmi: number;
  category: BMICategory;
  classification: BMIClassification;
  isHealthy: boolean;
  severity: BMISeverity;
  percentile?: number;
  idealWeightRange?: {
    min: number;
    max: number;
  };
}

export interface BMITrend {
  direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  change: number;
  changePercent: number;
  timeframe: string;
  significance: 'minimal' | 'slight' | 'moderate' | 'significant';
}

export interface BMIStatistics {
  totalRecords: number;
  averageBMI: number | null;
  minBMI: number | null;
  maxBMI: number | null;
  categoryDistribution: Record<string, number>;
  trend: BMITrend;
  lastCalculated: Date | null;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: BMISeverity;
}

// WHO Extended BMI Classifications for different populations
export const WHO_BMI_CLASSIFICATIONS = {
  'severely_underweight': { min: 0, max: 16, label: 'Severely underweight', risk: 'very_high' },
  'moderately_underweight': { min: 16, max: 17, label: 'Moderately underweight', risk: 'high' },
  'mildly_underweight': { min: 17, max: 18.5, label: 'Mildly underweight', risk: 'moderate' },
  'normal': { min: 18.5, max: 25, label: 'Normal range', risk: 'low' },
  'pre_obese': { min: 25, max: 30, label: 'Pre-obese', risk: 'moderate' },
  'obese_class_1': { min: 30, max: 35, label: 'Obese class I', risk: 'high' },
  'obese_class_2': { min: 35, max: 40, label: 'Obese class II', risk: 'very_high' },
  'obese_class_3': { min: 40, max: 999, label: 'Obese class III', risk: 'very_high' }
};

// Asian BMI Classifications (different thresholds)
export const ASIAN_BMI_CLASSIFICATIONS = {
  'underweight': { min: 0, max: 18.5, label: 'Underweight', risk: 'moderate' },
  'normal': { min: 18.5, max: 23, label: 'Normal', risk: 'low' },
  'overweight': { min: 23, max: 27.5, label: 'Overweight', risk: 'moderate' },
  'obese': { min: 27.5, max: 999, label: 'Obese', risk: 'high' }
};

// Age-specific BMI considerations
export const AGE_BMI_ADJUSTMENTS = {
  child: { min: 2, max: 17, note: 'Use pediatric growth charts' },
  young_adult: { min: 18, max: 24, adjustment: 0 },
  adult: { min: 25, max: 64, adjustment: 0 },
  senior: { min: 65, max: 150, note: 'Higher BMI may be protective in elderly' }
};

export function getBMIClassification(bmi: number, useAsianStandard: boolean = false): BMICategory {
  if (useAsianStandard) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 23) return 'normal';
    if (bmi < 27.5) return 'overweight';
    return 'obese_class1';
  }

  if (bmi < 16) return 'severely_underweight';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese_class1';
  if (bmi < 40) return 'obese_class2';
  return 'obese_class3';
}

export function getWHOClassification(bmi: number): string {
  for (const [key, value] of Object.entries(WHO_BMI_CLASSIFICATIONS)) {
    if (bmi >= value.min && bmi < value.max) {
      return value.label;
    }
  }
  return 'Unknown classification';
}

export function calculateBMI(height: number, weight: number): number {
  const heightInM = height / 100;
  return weight / (heightInM * heightInM);
}

export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const heightInM = height / 100;
  const minWeight = 18.5 * heightInM * heightInM;
  const maxWeight = 25 * heightInM * heightInM;
  
  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10
  };
}

export function getBMIPercentile(bmi: number, age: number, gender: Gender): number | null {
  // 這裡應該使用真實的百分位數據，這只是示例
  // 實際應用中需要使用 CDC 或 WHO 的百分位表
  if (age < 18) {
    // 兒童和青少年需要使用生長圖表
    return null;
  }
  
  // 成人簡化計算（僅供示例）
  const normalizedBMI = Math.max(15, Math.min(40, bmi));
  return Math.round(((normalizedBMI - 15) / 25) * 100);
}

export function validateBMIInput(height: number, weight: number, age?: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!height || height < 50 || height > 300) {
    errors.push('身高必須在 50-300cm 之間');
  }

  if (!weight || weight < 10 || weight > 500) {
    errors.push('體重必須在 10-500kg 之間');
  }

  if (age !== undefined && (age < 1 || age > 150)) {
    errors.push('年齡必須在 1-150 歲之間');
  }

  // BMI 合理性檢查
  if (height && weight) {
    const bmi = calculateBMI(height, weight);
    if (bmi < 10 || bmi > 70) {
      errors.push('計算出的 BMI 值不在合理範圍內，請檢查身高體重數據');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getBMIAdvice(bmi: number, category: BMICategory): {
  immediate: string[];
  longTerm: string[];
  warning: string[];
} {
  const classification = BMI_CLASSIFICATIONS[category];
  
  return {
    immediate: classification.recommendations.slice(0, 3),
    longTerm: classification.recommendations.slice(3),
    warning: classification.severity === 'very_high' ? 
      ['請立即尋求醫療協助', '這是高風險健康狀況'] : 
      classification.severity === 'high' ?
      ['建議諮詢醫療專業人員'] : []
  };
}
EOF

echo "✅ BMI 類型定義已創建 (Part 3-1)"

#!/bin/bash

echo "🔧 模組化修復 Part 3-2 - TDEE 類型定義"
echo "====================================="

# ===== TDEE 類型定義 =====
echo "📝 創建 TDEE 類型定義..."

cat > backend/src/projects/tdee/types/tdee.types.ts << 'EOF'
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