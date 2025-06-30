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
