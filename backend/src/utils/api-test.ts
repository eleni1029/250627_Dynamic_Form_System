// backend/src/utils/api-test.ts
import { BMICalculationRequest } from '../projects/bmi/types/bmi.types';
import { TDEECalculationRequest } from '../projects/tdee/types/tdee.types';

// BMI 測試數據
export const BMI_TEST_CASES = [
  {
    name: 'Normal BMI - Adult Male',
    data: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male'
    } as BMICalculationRequest,
    expectedBMI: 22.9,
    expectedCategory: '正常體重'
  },
  {
    name: 'Overweight BMI - Adult Female',
    data: {
      height: 160,
      weight: 68,
      age: 28,
      gender: 'female'
    } as BMICalculationRequest,
    expectedBMI: 26.6,
    expectedCategory: '超重'
  },
  {
    name: 'Underweight BMI',
    data: {
      height: 170,
      weight: 50,
      age: 25,
      gender: 'female'
    } as BMICalculationRequest,
    expectedBMI: 17.3,
    expectedCategory: '輕度體重不足'
  },
  {
    name: 'Normal BMI - Minimal Data',
    data: {
      height: 180,
      weight: 75
    } as BMICalculationRequest,
    expectedBMI: 23.1,
    expectedCategory: '正常體重'
  }
];

// TDEE 測試數據
export const TDEE_TEST_CASES = [
  {
    name: 'Sedentary Adult Male',
    data: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male',
      activity_level: 'sedentary'
    } as TDEECalculationRequest,
    expectedBMR: 1671,
    expectedTDEE: 2005,
    expectedBMI: 22.9
  },
  {
    name: 'Active Adult Female',
    data: {
      height: 160,
      weight: 55,
      age: 25,
      gender: 'female',
      activity_level: 'active'
    } as TDEECalculationRequest,
    expectedBMR: 1321,
    expectedTDEE: 2278,
    expectedBMI: 21.5
  }
];

// 驗證計算結果的工具函數
export const validateBMIResult = (result: any, expected: any): { isValid: boolean; details: string } => {
  const tolerance = 0.5; // BMI 容差範圍
  const bmiDiff = Math.abs(result.bmi - expected.expectedBMI);
  
  if (bmiDiff > tolerance) {
    return {
      isValid: false,
      details: `BMI mismatch: expected ${expected.expectedBMI}, got ${result.bmi} (diff: ${bmiDiff.toFixed(2)})`
    };
  }

  if (result.category !== expected.expectedCategory) {
    return {
      isValid: false,
      details: `Category mismatch: expected "${expected.expectedCategory}", got "${result.category}"`
    };
  }

  return {
    isValid: true,
    details: `BMI ${result.bmi} matches expected ${expected.expectedBMI} (±${tolerance})`
  };
};

export const validateTDEEResult = (result: any, expected: any): { isValid: boolean; details: string } => {
  const bmrTolerance = 50; // BMR 容差範圍
  const tdeeTolerance = 100; // TDEE 容差範圍
  const bmiTolerance = 0.5; // BMI 容差範圍
  
  const bmrDiff = Math.abs(result.bmr - expected.expectedBMR);
  const tdeeDiff = Math.abs(result.tdee - expected.expectedTDEE);
  const bmiDiff = Math.abs(result.bmi - expected.expectedBMI);

  if (bmrDiff > bmrTolerance) {
    return {
      isValid: false,
      details: `BMR mismatch: expected ${expected.expectedBMR}, got ${result.bmr} (diff: ${bmrDiff})`
    };
  }

  if (tdeeDiff > tdeeTolerance) {
    return {
      isValid: false,
      details: `TDEE mismatch: expected ${expected.expectedTDEE}, got ${result.tdee} (diff: ${tdeeDiff})`
    };
  }

  if (bmiDiff > bmiTolerance) {
    return {
      isValid: false,
      details: `BMI mismatch: expected ${expected.expectedBMI}, got ${result.bmi} (diff: ${bmiDiff.toFixed(2)})`
    };
  }

  return {
    isValid: true,
    details: `All values within tolerance: BMR ${result.bmr} (±${bmrTolerance}), TDEE ${result.tdee} (±${tdeeTolerance}), BMI ${result.bmi} (±${bmiTolerance})`
  };
};

// 生成隨機測試數據
export const generateRandomBMIData = (): BMICalculationRequest => {
  const heights = [150, 155, 160, 165, 170, 175, 180, 185, 190, 195];
  const weightRange = { min: 40, max: 120 };
  const ageRange = { min: 18, max: 80 };
  const genders: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];

  return {
    height: heights[Math.floor(Math.random() * heights.length)],
    weight: Math.floor(Math.random() * (weightRange.max - weightRange.min) + weightRange.min),
    age: Math.floor(Math.random() * (ageRange.max - ageRange.min) + ageRange.min),
    gender: genders[Math.floor(Math.random() * genders.length)]
  };
};

export const generateRandomTDEEData = (): TDEECalculationRequest => {
  const heights = [150, 155, 160, 165, 170, 175, 180, 185, 190, 195];
  const weightRange = { min: 40, max: 120 };
  const ageRange = { min: 18, max: 80 };
  const genders: ('male' | 'female')[] = ['male', 'female'];
  const activityLevels: ('sedentary' | 'light' | 'moderate' | 'active' | 'very_active')[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

  return {
    height: heights[Math.floor(Math.random() * heights.length)],
    weight: Math.floor(Math.random() * (weightRange.max - weightRange.min) + weightRange.min),
    age: Math.floor(Math.random() * (ageRange.max - ageRange.min) + ageRange.min),
    gender: genders[Math.floor(Math.random() * genders.length)],
    activity_level: activityLevels[Math.floor(Math.random() * activityLevels.length)]
  };
};

// API 測試輔助函數
export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
  error?: string;
}

export class APITester {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
    }

    return result;
  }

  async testBMICalculation(testCase: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.makeRequest('POST', '/api/projects/bmi/calculate', testCase.data);
      const duration = Date.now() - startTime;

      if (!result.success || !result.data) {
        return {
          name: testCase.name,
          passed: false,
          details: 'API returned unsuccessful response',
          duration,
          error: result.error || 'Unknown error'
        };
      }

      const validation = validateBMIResult(result.data, testCase);

      return {
        name: testCase.name,
        passed: validation.isValid,
        details: validation.details,
        duration
      };

    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        details: 'Request failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testTDEECalculation(testCase: any): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.makeRequest('POST', '/api/projects/tdee/calculate', testCase.data);
      const duration = Date.now() - startTime;

      if (!result.success || !result.data) {
        return {
          name: testCase.name,
          passed: false,
          details: 'API returned unsuccessful response',
          duration,
          error: result.error || 'Unknown error'
        };
      }

      const validation = validateTDEEResult(result.data, testCase);

      return {
        name: testCase.name,
        passed: validation.isValid,
        details: validation.details,
        duration
      };

    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        details: 'Request failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testHealthCheck(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.makeRequest('GET', '/api/health');
      const duration = Date.now() - startTime;

      const isHealthy = result.success && result.data?.status === 'healthy';

      return {
        name: 'Health Check',
        passed: isHealthy,
        details: isHealthy ? 'System is healthy' : 'System is not healthy',
        duration
      };

    } catch (error) {
      return {
        name: 'Health Check',
        passed: false,
        details: 'Health check failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}