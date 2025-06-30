#!/bin/bash

echo "🔧 模組化修復 Part 3-2 - BMI 功能函數與驗證"
echo "==========================================="

# ===== BMI 計算與驗證函數 =====
echo "📝 創建 BMI 計算與驗證函數..."

cat > backend/src/projects/bmi/types/bmi-utils.types.ts << 'EOF'
import { BMICategory, Gender, BMIValidation } from './bmi-base.types';
import { BMI_CLASSIFICATIONS, WHO_BMI_CLASSIFICATIONS, ASIAN_BMI_CLASSIFICATIONS } from './bmi-classifications.types';

// 年齡分組的 BMI 考慮
export const AGE_BMI_ADJUSTMENTS = {
  child: { min: 2, max: 17, note: 'Use pediatric growth charts' },
  young_adult: { min: 18, max: 24, adjustment: 0 },
  adult: { min: 25, max: 64, adjustment: 0 },
  senior: { min: 65, max: 150, note: 'Higher BMI may be protective in elderly' }
};

// BMI 計算函數
export function calculateBMI(height: number, weight: number): number {
  const heightInM = height / 100;
  return weight / (heightInM * heightInM);
}

// BMI 分類判斷
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

// WHO 分類
export function getWHOClassification(bmi: number): string {
  for (const [key, value] of Object.entries(WHO_BMI_CLASSIFICATIONS)) {
    if (bmi >= value.min && bmi < value.max) {
      return value.label;
    }
  }
  return 'Unknown classification';
}

// 理想體重範圍計算
export function calculateIdealWeightRange(height: number): { min: number; max: number } {
  const heightInM = height / 100;
  const minWeight = 18.5 * heightInM * heightInM;
  const maxWeight = 25 * heightInM * heightInM;
  
  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10
  };
}

// BMI 百分位計算（簡化版本）
export function getBMIPercentile(bmi: number, age: number, gender: Gender): number | null {
  // 實際應用中需要使用 CDC 或 WHO 的百分位表
  if (age < 18) {
    // 兒童和青少年需要使用生長圖表
    return null;
  }
  
  // 成人簡化計算（僅供示例）
  const normalizedBMI = Math.max(15, Math.min(40, bmi));
  return Math.round(((normalizedBMI - 15) / 25) * 100);
}

// BMI 輸入驗證
export function validateBMIInput(
  height: number, 
  weight: number, 
  age?: number
): BMIValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 身高驗證
  if (!height || height < 50 || height > 300) {
    errors.push('身高必須在 50-300cm 之間');
  }

  // 體重驗證
  if (!weight || weight < 10 || weight > 500) {
    errors.push('體重必須在 10-500kg 之間');
  }

  // 年齡驗證
  if (age !== undefined && (age < 1 || age > 150)) {
    errors.push('年齡必須在 1-150 歲之間');
  }

  // BMI 合理性檢查
  if (height && weight) {
    const bmi = calculateBMI(height, weight);
    if (bmi < 10 || bmi > 70) {
      errors.push('計算出的 BMI 值不在合理範圍內，請檢查身高體重數據');
    }

    // 添加警告
    if (bmi < 15) {
      warnings.push('BMI 值過低，建議尋求醫療協助');
    } else if (bmi > 50) {
      warnings.push('BMI 值過高，建議立即諮詢醫療專業人員');
    }
  }

  // 年齡相關警告
  if (age !== undefined) {
    if (age < 18) {
      warnings.push('未成年人的 BMI 計算結果僅供參考，建議使用兒童生長圖表');
    } else if (age > 65) {
      warnings.push('年長者的 BMI 標準可能與一般成人有所不同');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// BMI 建議生成
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

// BMI 趨勢分析
export function analyzeBMITrend(
  current: number, 
  previous: number, 
  timeframe: string = '1 month'
): {
  direction: string;
  change: number;
  changePercent: number;
  significance: string;
} {
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  
  let direction = 'stable';
  let significance = 'minimal';

  if (Math.abs(change) >= 2) {
    significance = 'significant';
  } else if (Math.abs(change) >= 1) {
    significance = 'moderate';
  } else if (Math.abs(change) >= 0.5) {
    significance = 'slight';
  }

  if (change > 0.5) {
    direction = 'increasing';
  } else if (change < -0.5) {
    direction = 'decreasing';
  }

  return {
    direction,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    significance
  };
}

// 健康狀態評估
export function assessHealthStatus(bmi: number, category: BMICategory): string {
  switch (category) {
    case 'severely_underweight':
      return 'critical';
    case 'underweight':
      return 'poor';
    case 'normal':
      return 'excellent';
    case 'overweight':
      return 'good';
    case 'obese_class1':
      return 'fair';
    case 'obese_class2':
      return 'poor';
    case 'obese_class3':
      return 'critical';
    default:
      return 'unknown';
  }
}

// BMI 相關風險等級
export function getRiskLevel(bmi: number): string {
  if (bmi < 16 || bmi >= 40) return 'very_high';
  if (bmi < 17 || bmi >= 35) return 'high';
  if (bmi < 18.5 || bmi >= 25) return 'moderate';
  return 'low';
}
EOF

echo "✅ BMI 計算與驗證函數已創建"

# ===== BMI 紀錄相關類型 =====
echo "📝 創建 BMI 紀錄相關類型..."

cat > backend/src/projects/bmi/types/bmi-record.types.ts << 'EOF'
import { BMICalculationRequest, BMICalculationResult, BMISeverity } from './bmi-base.types';

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  category_code: string;
  age?: number;
  gender?: string;
  is_healthy: boolean;
  who_classification: string;
  health_risks: string[];
  recommendations: string[];
  severity: BMISeverity;
  color_code: string;
  use_asian_standard?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BMIHistoryQuery {
  userId: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  orderBy?: 'created_at' | 'bmi' | 'weight';
  order?: 'ASC' | 'DESC';
}

export interface BMIAnalytics {
  userId: string;
  totalRecords: number;
  averageBMI: number;
  minBMI: number;
  maxBMI: number;
  bmiRange: {
    min: number;
    max: number;
  };
  categoryDistribution: Record<string, number>;
  monthlyProgress: Array<{
    month: string;
    averageBMI: number;
    recordCount: number;
  }>;
  healthRiskTrend: string;
  improvementSuggestions: string[];
}

export interface BMIComparisonData {
  current: BMIRecord;
  previous?: BMIRecord;
  trend: {
    direction: string;
    change: number;
    timeframe: string;
    significance: string;
  };
  goalProgress?: {
    targetBMI: number;
    progressPercent: number;
    estimatedTimeToGoal: string;
  };
}

export interface BMIExportData {
  userId: string;
  exportDate: Date;
  records: BMIRecord[];
  summary: {
    totalRecords: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    averageBMI: number;
    healthStatus: string;
    recommendations: string[];
  };
}

// BMI 計算模式
export interface BMICalculationMode {
  standard: 'WHO' | 'Asian' | 'Custom';
  adjustForAge: boolean;
  includeBodyFat?: boolean;
  includeMuscle?: boolean;
}

// BMI 目標設定
export interface BMIGoal {
  id: string;
  userId: string;
  targetBMI: number;
  targetWeight: number;
  targetDate: Date;
  currentBMI: number;
  currentWeight: number;
  strategy: 'weight_loss' | 'weight_gain' | 'maintenance';
  weeklyGoal: number; // kg per week
  isActive: boolean;
  created_at: Date;
  updated_at: Date;
}

// BMI 追蹤配置
export interface BMITrackingConfig {
  userId: string;
  reminderEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  goalReminderEnabled: boolean;
  healthTipsEnabled: boolean;
  progressReportsEnabled: boolean;
  shareWithDoctor: boolean;
  privacyLevel: 'private' | 'family' | 'public';
}
EOF

echo "✅ BMI 紀錄相關類型已創建"

echo "✅ Part 3-2 完成 - BMI 功能函數與驗證已建立"