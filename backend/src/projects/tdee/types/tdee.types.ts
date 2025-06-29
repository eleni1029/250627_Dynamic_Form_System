export const ACTIVITY_LEVELS = {
  sedentary: {
    multiplier: 1.2,
    description: 'Little or no exercise',
    name: 'Sedentary'
  },
  light: {
    multiplier: 1.375,
    description: 'Light exercise/sports 1-3 days/week',
    name: 'Lightly Active'
  },
  moderate: {
    multiplier: 1.55,
    description: 'Moderate exercise/sports 3-5 days/week',
    name: 'Moderately Active'
  },
  active: {
    multiplier: 1.725,
    description: 'Hard exercise/sports 6-7 days a week',
    name: 'Very Active'
  },
  very_active: {
    multiplier: 1.9,
    description: 'Very hard exercise/sports & physical job or training twice a day',
    name: 'Extra Active'
  }
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;
export type Gender = 'male' | 'female';

export interface TDEECalculationRequest {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
}

export interface TDEECalculationResult {
  bmr: number;
  tdee: number;
  activityInfo: {
    level: ActivityLevel;
    multiplier: number;
    description: string;
    name: string;
  };
}
