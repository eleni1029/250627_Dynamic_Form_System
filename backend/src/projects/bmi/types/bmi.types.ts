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
