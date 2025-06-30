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
