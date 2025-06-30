#!/bin/bash

echo "🔧 模組化修復 Part 3-4 - TDEE 計算與營養類型"
echo "==========================================="

# ===== TDEE 計算公式與營養類型 =====
echo "📝 創建 TDEE 計算公式與營養類型..."

cat > backend/src/projects/tdee/types/tdee-calculations.types.ts << 'EOF'
import { Gender, BMRFormula } from './tdee-base.types';

// BMR 計算公式定義
export interface BMRFormulaInfo {
  name: string;
  description: string;
  accuracy: 'moderate' | 'high' | 'very_high';
  maleFormula?: (weight: number, height: number, age: number) => number;
  femaleFormula?: (weight: number, height: number, age: number) => number;
  bodyFatFormula?: (leanBodyMass: number) => number;
  requiresBodyFat: boolean;
}

export const BMR_FORMULAS: Record<BMRFormula, BMRFormulaInfo> = {
  mifflin_st_jeor: {
    name: 'Mifflin-St Jeor',
    description: '最準確的現代公式，適用於大多數人',
    accuracy: 'high',
    requiresBodyFat: false,
    maleFormula: (weight: number, height: number, age: number) => 
      88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age),
    femaleFormula: (weight: number, height: number, age: number) => 
      447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  },
  harris_benedict: {
    name: 'Harris-Benedict (Revised)',
    description: '經典公式，略高估代謝率',
    accuracy: 'moderate',
    requiresBodyFat: false,
    maleFormula: (weight: number, height: number, age: number) => 
      88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age),
    femaleFormula: (weight: number, height: number, age: number) => 
      447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  },
  katch_mcardle: {
    name: 'Katch-McArdle',
    description: '基於瘦體重，需要體脂率數據',
    accuracy: 'very_high',
    requiresBodyFat: true,
    bodyFatFormula: (leanBodyMass: number) => 370 + (21.6 * leanBodyMass)
  }
};

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

// BMR 計算函數
export function calculateBMR(
  height: number, 
  weight: number, 
  age: number, 
  gender: Gender, 
  formula: BMRFormula = 'mifflin_st_jeor',
  bodyFatPercentage?: number
): number {
  const formulaInfo = BMR_FORMULAS[formula];
  
  switch (formula) {
    case 'mifflin_st_jeor':
    case 'harris_benedict':
      const genderFormula = gender === 'male' ? formulaInfo.maleFormula : formulaInfo.femaleFormula;
      if (!genderFormula) throw new Error(`No formula defined for gender: ${gender}`);
      return genderFormula(weight, height, age);
    
    case 'katch_mcardle':
      if (!bodyFatPercentage || !formulaInfo.bodyFatFormula) {
        throw new Error('Body fat percentage required for Katch-McArdle formula');
      }
      const leanBodyMass = weight * (1 - bodyFatPercentage / 100);
      return formulaInfo.bodyFatFormula(leanBodyMass);
    
    default:
      throw new Error(`Unknown BMR formula: ${formula}`);
  }
}

// 代謝年齡計算
export function calculateMetabolicAge(
  bmr: number, 
  actualAge: number, 
  gender: Gender
): number {
  // 基於統計數據的簡化計算
  // 實際應用需要更複雜的算法和更多數據
  const baselineBMR = gender === 'male' ? 1800 : 1400;
  const ageAdjustment = (actualAge - 30) * (gender === 'male' ? 8 : 6);
  const expectedBMR = baselineBMR - ageAdjustment;
  
  const metabolicDifference = bmr - expectedBMR;
  const metabolicAge = actualAge - (metabolicDifference / (gender === 'male' ? 8 : 6));
  
  return Math.max(18, Math.min(80, Math.round(metabolicAge)));
}

// TDEE 計算
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
}

// 熱量需求驗證
export function validateCalorieNeeds(
  tdee: number, 
  age: number, 
  gender: Gender, 
  weight: number
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // 最低熱量需求檢查
  const minCalories = gender === 'male' ? 1500 : 1200;
  if (tdee < minCalories) {
    warnings.push(`計算出的熱量需求 (${tdee}) 低於建議最低值 (${minCalories})`);
  }
  
  // 過高熱量檢查
  const maxCalories = weight * 50; // 簡化的上限計算
  if (tdee > maxCalories) {
    warnings.push(`計算出的熱量需求似乎過高，請檢查活動等級設定`);
  }
  
  // 年齡相關警告
  if (age < 18) {
    warnings.push('未成年人的熱量需求計算結果僅供參考');
  } else if (age > 65) {
    warnings.push('年長者的熱量需求可能需要專業營養師評估');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}
EOF

echo "✅ TDEE 計算公式類型已創建"

# ===== TDEE 營養建議類型 =====
echo "📝 創建 TDEE 營養建議類型..."

cat > backend/src/projects/tdee/types/tdee-nutrition.types.ts << 'EOF'
import { Gender, ActivityLevel } from './tdee-base.types';

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

// 宏營養素來源建議
export const MACRONUTRIENT_SOURCES = {
  protein: {
    animal: ['雞胸肉', '魚類', '蛋類', '牛肉', '豬里肌', '海鮮'],
    plant: ['豆腐', '豆類', '堅果', '種子', '藜麥', '燕麥'],
    dairy: ['希臘優格', '低脂牛奶', '起司', '乳清蛋白'],
    supplements: ['乳清蛋白粉', '植物蛋白粉', '胺基酸']
  },
  carbs: {
    complex: ['糙米', '燕麥', '地瓜', '藜麥', '全麥麵包'],
    simple: ['水果', '蜂蜜', '運動飲料'],
    vegetables: ['根莖類蔬菜', '豆類', '玉米'],
    timing: ['運動前後', '早餐', '午餐']
  },
  fat: {
    healthy: ['酪梨', '堅果', '橄欖油', '魚油', '亞麻籽'],
    omega3: ['鮭魚', '沙丁魚', '核桃', '奇亞籽'],
    monounsaturated: ['橄欖油', '酪梨', '杏仁'],
    avoid: ['反式脂肪', '過量飽和脂肪']
  },
  fiber: {
    soluble: ['燕麥', '豆類', '蘋果', '柑橘類'],
    insoluble: ['全穀類', '蔬菜', '水果皮'],
    benefits: ['消化健康', '血糖控制', '膽固醇管理']
  }
};

// 營養時機建議
export const NUTRITION_TIMING = {
  pre_workout: {
    timeframe: '運動前30-60分鐘',
    macros: { carbs: 0.5, protein: 0.2, fat: 0.1 }, // g/kg bodyweight
    foods: ['香蕉', '燕麥', '希臘優格'],
    avoid: ['高脂肪', '高纖維', '大量食物']
  },
  post_workout: {
    timeframe: '運動後30分鐘內',
    macros: { carbs: 1.0, protein: 0.25, fat: 0.1 },
    foods: ['蛋白質奶昔', '雞胸肉配地瓜', '巧克力牛奶'],
    purpose: ['肌肉修復', '糖原補充', '減少肌肉分解']
  },
  daily_distribution: {
    breakfast: { calories: 0.25, protein: 0.3, carbs: 0.4, fat: 0.3 },
    lunch: { calories: 0.3, protein: 0.3, carbs: 0.4, fat: 0.3 },
    dinner: { calories: 0.25, protein: 0.4, carbs: 0.3, fat: 0.3 },
    snacks: { calories: 0.2, protein: 0.2, carbs: 0.3, fat: 0.5 }
  }
};

// 特殊飲食考量
export const SPECIAL_DIETARY_CONSIDERATIONS = {
  vegetarian: {
    protein_sources: ['豆類', '堅果', '種子', '奶製品', '蛋類'],
    nutrients_focus: ['維生素B12', '鐵質', '鋅', 'Omega-3'],
    meal_planning: ['蛋白質互補', '鐵質吸收增強', '維生素B12補充']
  },
  vegan: {
    protein_sources: ['豆類', '堅果', '種子', '藜麥', '營養酵母'],
    nutrients_focus: ['維生素B12', '鐵質', '鋅', 'Omega-3', '維生素D', '鈣質'],
    meal_planning: ['蛋白質互補必須', '營養補充劑', '多樣化食物']
  },
  keto: {
    macros: { carbs: 0.05, protein: 0.2, fat: 0.75 },
    foods: ['肉類', '魚類', '蛋類', '堅果', '低碳蔬菜'],
    monitoring: ['酮體水平', '電解質平衡', '纖維攝取']
  },
  intermittent_fasting: {
    patterns: ['16:8', '14:10', '5:2'],
    considerations: ['營養密度', '用餐時機', '水分攝取'],
    benefits: ['代謝靈活性', '胰島素敏感性', '細胞自噬']
  }
};

// 年齡相關營養建議
export const AGE_SPECIFIC_NUTRITION = {
  teens: {
    age_range: '13-19',
    considerations: ['快速成長', '激素變化', '活動量高'],
    nutrients_focus: ['鈣質', '鐵質', '蛋白質', '維生素D'],
    calorie_adjustment: 1.1
  },
  adults: {
    age_range: '20-64',
    considerations: ['代謝穩定', '工作壓力', '生活型態'],
    nutrients_focus: ['均衡攝取', '抗氧化劑', 'Omega-3'],
    calorie_adjustment: 1.0
  },
  seniors: {
    age_range: '65+',
    considerations: ['代謝下降', '肌肉流失', '消化功能'],
    nutrients_focus: ['蛋白質', '維生素B12', '維生素D', '鈣質'],
    calorie_adjustment: 0.9
  }
};

// 營養建議生成函數
export function generateNutritionAdvice(
  age: number, 
  gender: Gender, 
  activityLevel: ActivityLevel,
  tdee: number
): string[] {
  const advice: string[] = [];
  
  // 基礎建議
  advice.push('維持均衡飲食，包含各類營養素');
  advice.push(`每日建議水分攝取：${GENDER_SPECIFIC_NUTRITION[gender].water.daily}公升`);
  
  // 年齡相關建議
  if (age < 18) {
    advice.push('青少年需要額外的營養支持成長發育');
    advice.push('建議諮詢兒童營養師');
  } else if (age > 65) {
    advice.push('年長者需要注意蛋白質攝取，預防肌少症');
    advice.push('補充維生素D和鈣質');
  }
  
  // 性別特定建議
  advice.push(...GENDER_SPECIFIC_NUTRITION[gender].specificNeeds.map(need => `注意攝取：${need}`));
  
  // 活動等級相關建議
  if (['active', 'very_active'].includes(activityLevel)) {
    advice.push('運動前後適當補充碳水化合物');
    advice.push('運動後30分鐘內補充蛋白質');
    advice.push('注意電解質平衡');
  }
  
  return advice;
}
EOF

echo "✅ TDEE 營養建議類型已創建"

echo "✅ Part 3-4 完成 - TDEE 計算與營養類型已建立"