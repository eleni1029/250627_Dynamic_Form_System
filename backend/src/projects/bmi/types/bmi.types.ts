export type Gender = 'male' | 'female';
export type BMICategory = 
  | 'severely_underweight' 
  | 'underweight' 
  | 'normal' 
  | 'overweight' 
  | 'obese_class1' 
  | 'obese_class2' 
  | 'obese_class3';

export type BMISeverity = 'low' | 'normal' | 'moderate' | 'high' | 'very_high';

export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: Gender;
  useAsianStandard?: boolean;
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  categoryCode: BMICategory;
  isHealthy: boolean;
  whoStandard: string;
  healthRisks: string[];
  recommendations: string[];
  severity?: BMISeverity;
  colorCode?: string;
}

export interface BMIClassification {
  category: string;
  range: { min: number; max: number };
  description: string;
  healthRisks: string[];
  recommendations: string[];
  colorCode: string;
  severity: BMISeverity;
  whoCode: string;
}

export const BMI_CLASSIFICATIONS: Record<BMICategory, BMIClassification> = {
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
    severity: 'very_high',
    whoCode: 'severely_underweight'
  },
  underweight: {
    category: 'Underweight',
    range: { min: 16, max: 18.5 },
    description: 'Below normal weight',
    healthRisks: [
      '營養不良風險',
      '免疫力下降',
      '骨密度降低',
      '生育能力問題'
    ],
    recommendations: [
      '增加健康熱量攝取',
      '諮詢營養師制定增重計畫',
      '進行適度的重量訓練',
      '定期監測體重變化'
    ],
    colorCode: '#4169E1',
    severity: 'moderate',
    whoCode: 'underweight'
  },
  normal: {
    category: 'Normal weight',
    range: { min: 18.5, max: 25 },
    description: 'Healthy weight range',
    healthRisks: ['健康風險較低', '最佳健康狀態'],
    recommendations: [
      '維持均衡飲食',
      '保持規律運動',
      '定期健康檢查',
      '維持健康的生活方式'
    ],
    colorCode: '#228B22',
    severity: 'low',
    whoCode: 'normal'
  },
  overweight: {
    category: 'Overweight',
    range: { min: 25, max: 30 },
    description: 'Above normal weight',
    healthRisks: [
      '心血管疾病風險增加',
      '2型糖尿病風險',
      '高血壓風險',
      '睡眠呼吸中止症風險'
    ],
    recommendations: [
      '控制熱量攝取',
      '增加運動頻率和強度',
      '諮詢營養師制定減重計畫',
      '設定合理的減重目標'
    ],
    colorCode: '#FF8C00',
    severity: 'moderate',
    whoCode: 'pre_obese'
  },
  obese_class1: {
    category: 'Obese Class I',
    range: { min: 30, max: 35 },
    description: 'Moderately obese',
    healthRisks: [
      '嚴重心血管疾病風險',
      '2型糖尿病高風險',
      '睡眠呼吸中止症',
      '某些癌症風險增加'
    ],
    recommendations: [
      '諮詢醫生制定綜合減重計畫',
      '採用低熱量、均衡飲食',
      '進行適合的有氧運動',
      '考慮專業醫療介入'
    ],
    colorCode: '#FF4500',
    severity: 'high',
    whoCode: 'obese_class_1'
  },
  obese_class2: {
    category: 'Obese Class II',
    range: { min: 35, max: 40 },
    description: 'Severely obese',
    healthRisks: [
      '極高心血管疾病風險',
      '糖尿病併發症風險',
      '嚴重睡眠呼吸中止症',
      '多種癌症風險'
    ],
    recommendations: [
      '立即尋求醫療協助',
      '考慮減重手術評估',
      '嚴格醫療監督',
      '多學科治療團隊'
    ],
    colorCode: '#DC143C',
    severity: 'very_high',
    whoCode: 'obese_class_2'
  },
  obese_class3: {
    category: 'Obese Class III',
    range: { min: 40, max: 999 },
    description: 'Morbidly obese - highest health risk category',
    healthRisks: [
      '生命威脅性健康風險',
      '嚴重心血管併發症',
      '多器官系統衰竭風險',
      '嚴重糖尿病併發症'
    ],
    recommendations: [
      '緊急醫療介入',
      '減重手術評估',
      '重症醫學監護',
      '全面醫療團隊治療'
    ],
    colorCode: '#8B0000',
    severity: 'very_high',
    whoCode: 'obese_class_3'
  }
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

export function getBMIAdvice(bmi: number, category: BMICategory): {
  immediate: string[];
  longTerm: string[];
  warning: string[];
} {
  const classification = BMI_CLASSIFICATIONS[category];
  
  if (!classification) {
    return {
      immediate: ['建議諮詢專業醫療人員'],
      longTerm: ['定期健康檢查'],
      warning: ['無法確定健康風險']
    };
  }
  
  return {
    immediate: classification.recommendations.slice(0, 3),
    longTerm: classification.recommendations.slice(3),
    warning: classification.severity === 'very_high' ? 
      ['請立即尋求醫療協助', '這是高風險健康狀況'] : 
      classification.severity === 'high' ?
      ['建議諮詢醫療專業人員'] : []
  };
}

export interface BMIValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export function validateBMIInput(height: number, weight: number, age?: number): BMIValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!height || height < 50 || height > 300) {
    errors.push('身高必須在 50-300cm 之間');
  }

  if (!weight || weight < 10 || weight > 500) {
    errors.push('體重必須在 10-500kg 之間');
  }

  if (age !== undefined && (age < 1 || age > 150)) {
    errors.push('年齡必須在 1-150 歲之間');
  }

  if (height && weight) {
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    if (bmi < 10 || bmi > 70) {
      errors.push('計算出的 BMI 值不在合理範圍內，請檢查身高體重數據');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
