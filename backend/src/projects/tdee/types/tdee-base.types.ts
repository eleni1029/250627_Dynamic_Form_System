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
