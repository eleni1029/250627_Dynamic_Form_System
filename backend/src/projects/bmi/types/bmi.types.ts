export interface BMICalculationRequest {
  height: number;
  weight: number;
  age?: number;
  gender?: string;
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  isHealthy: boolean;
}

export const BMI_CATEGORIES = {
  UNDERWEIGHT: 'Underweight',
  NORMAL: 'Normal weight',
  OVERWEIGHT: 'Overweight',
  OBESE: 'Obese'
} as const;

export type BMICategory = typeof BMI_CATEGORIES[keyof typeof BMI_CATEGORIES];
