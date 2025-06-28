export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  category_en: string;
  isHealthy: boolean;
  recommendations: string[];
  healthRisk: string;
}

export interface BMIRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  age?: number;
  gender?: string;
  created_at: Date;
}

export interface BMIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface BMIHistoryQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}
