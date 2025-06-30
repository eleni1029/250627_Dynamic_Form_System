#!/bin/bash

echo "🔧 模組化修復 Part 3-3 - TDEE 基礎類型與活動等級"
echo "=============================================="

# ===== 創建目錄結構 =====
echo "📁 確保 TDEE 目錄結構存在..."

mkdir -p backend/src/projects/tdee/types
mkdir -p backend/src/projects/tdee/middleware

# ===== TDEE 基礎類型定義 =====
echo "📝 創建 TDEE 基礎類型定義..."

cat > backend/src/projects/tdee/types/tdee-base.types.ts << 'EOF'
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

export interface TDEEValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
EOF

echo "✅ TDEE 基礎類型定義已創建"

# ===== TDEE 活動等級定義 =====
echo "📝 創建 TDEE 活動等級定義..."

cat > backend/src/projects/tdee/types/tdee-activity.types.ts << 'EOF'
import { ActivityLevel } from './tdee-base.types';

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

// 運動類型對TDEE的影響
export const EXERCISE_IMPACT = {
  cardio: {
    light: { 
      caloriesPerHour: 300, 
      examples: ['散步', '慢速游泳', '輕鬆騎自行車'],
      mets: 3.5 
    },
    moderate: { 
      caloriesPerHour: 500, 
      examples: ['慢跑', '騎自行車', '有氧舞蹈'],
      mets: 6.0 
    },
    vigorous: { 
      caloriesPerHour: 700, 
      examples: ['快跑', '高強度間歇', '激烈運動'],
      mets: 8.5 
    }
  },
  strength: {
    light: { 
      caloriesPerHour: 200, 
      examples: ['輕重量訓練', '皮拉提斯', '伸展運動'],
      mets: 3.0 
    },
    moderate: { 
      caloriesPerHour: 350, 
      examples: ['重量訓練', 'CrossFit', '功能性訓練'],
      mets: 5.0 
    },
    vigorous: { 
      caloriesPerHour: 450, 
      examples: ['重量競技', '高強度力量訓練'],
      mets: 6.5 
    }
  },
  sports: {
    recreational: { 
      caloriesPerHour: 400, 
      examples: ['網球', '籃球', '足球', '羽毛球'],
      mets: 5.5 
    },
    competitive: { 
      caloriesPerHour: 600, 
      examples: ['比賽級運動', '專業訓練', '格鬥運動'],
      mets: 8.0 
    }
  },
  lifestyle: {
    household: {
      caloriesPerHour: 150,
      examples: ['家務清潔', '園藝工作', '購物'],
      mets: 2.5
    },
    occupational: {
      light: { caloriesPerHour: 200, examples: ['辦公室工作'], mets: 1.5 },
      moderate: { caloriesPerHour: 300, examples: ['教學', '零售'], mets: 3.0 },
      heavy: { caloriesPerHour: 500, examples: ['建築工作', '農業'], mets: 6.0 }
    }
  }
};

// 活動等級評估工具
export interface ActivityAssessment {
  workoutFrequency: number; // 每週運動次數
  workoutDuration: number;  // 平均每次運動時間（分鐘）
  workoutIntensity: 'low' | 'moderate' | 'high';
  dailySteps: number;
  occupationType: 'sedentary' | 'standing' | 'physical';
  sportsParticipation: boolean;
  recommendedLevel: ActivityLevel;
  confidence: number; // 0-100
}

export function assessActivityLevel(assessment: ActivityAssessment): ActivityLevel {
  let score = 0;
  
  // 運動頻率評分
  score += assessment.workoutFrequency * 0.3;
  
  // 運動持續時間評分
  score += (assessment.workoutDuration / 60) * 0.2;
  
  // 運動強度評分
  const intensityScore = {
    'low': 0.5,
    'moderate': 1.0,
    'high': 1.5
  };
  score += intensityScore[assessment.workoutIntensity];
  
  // 日常步數評分
  if (assessment.dailySteps > 10000) score += 1;
  else if (assessment.dailySteps > 7500) score += 0.7;
  else if (assessment.dailySteps > 5000) score += 0.4;
  
  // 職業類型評分
  const occupationScore = {
    'sedentary': 0,
    'standing': 0.3,
    'physical': 0.8
  };
  score += occupationScore[assessment.occupationType];
  
  // 運動參與評分
  if (assessment.sportsParticipation) score += 0.5;
  
  // 根據總分確定活動等級
  if (score >= 5) return 'very_active';
  if (score >= 3.5) return 'active';
  if (score >= 2) return 'moderate';
  if (score >= 1) return 'light';
  return 'sedentary';
}

export function getActivityLevelInfo(level: ActivityLevel): ActivityLevelInfo {
  return ACTIVITY_LEVELS[level];
}

export function validateActivityLevel(level: string): level is ActivityLevel {
  return Object.keys(ACTIVITY_LEVELS).includes(level);
}
EOF

echo "✅ TDEE 活動等級定義已創建"

echo "✅ Part 3-3 完成 - TDEE 基礎類型與活動等級已建立" type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
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
  extremeWeightLoss: number;   // -30% (需醫療監督)
  mildWeightGain: number;      // +5%
  moderateWeightGain: number;  // +10%
  aggressiveWeightGain: number; // +15%
  bulking: number;             // +20% (增肌期)
}

export