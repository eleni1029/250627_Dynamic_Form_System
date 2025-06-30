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
