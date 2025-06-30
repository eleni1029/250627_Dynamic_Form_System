import { BMIModel, BMICalculationRequest, BMICalculationResult, BMIRecord } from '../models/BMIRecord';
import { logger } from '../../../utils/logger';

export class BMIService {
  private bmiModel: BMIModel;

  constructor() {
    this.bmiModel = new BMIModel();
  }

  async calculateBMI(request: BMICalculationRequest): Promise<BMICalculationResult> {
    try {
      const { height, weight } = request;
      const heightInM = height / 100;
      const bmi = weight / (heightInM * heightInM);
      
      let category = 'Normal weight';
      let categoryCode = 'normal';
      let isHealthy = true;
      
      if (bmi < 18.5) {
        category = 'Underweight';
        categoryCode = 'underweight';
        isHealthy = false;
      } else if (bmi >= 25 && bmi < 30) {
        category = 'Overweight';
        categoryCode = 'overweight';
        isHealthy = false;
      } else if (bmi >= 30) {
        category = 'Obese';
        categoryCode = 'obese';
        isHealthy = false;
      }

      return {
        bmi: Math.round(bmi * 100) / 100,
        category,
        categoryCode,
        isHealthy,
        whoStandard: this.getWHOClassification(bmi),
        healthRisks: this.getHealthRisks(bmi),
        recommendations: this.getRecommendations(bmi, categoryCode)
      };
    } catch (error) {
      logger.error('BMI calculation service error:', error);
      throw new Error('Failed to calculate BMI');
    }
  }

  private getWHOClassification(bmi: number): string {
    if (bmi < 16) return 'Severely underweight';
    if (bmi < 17) return 'Moderately underweight';
    if (bmi < 18.5) return 'Mildly underweight';
    if (bmi < 25) return 'Normal range';
    if (bmi < 30) return 'Pre-obese';
    if (bmi < 35) return 'Obese class I';
    if (bmi < 40) return 'Obese class II';
    return 'Obese class III';
  }

  private getHealthRisks(bmi: number): string[] {
    if (bmi < 18.5) {
      return ['營養不良風險', '免疫力下降', '骨密度降低'];
    } else if (bmi >= 25 && bmi < 30) {
      return ['心血管疾病風險增加', '糖尿病風險', '高血壓風險'];
    } else if (bmi >= 30) {
      return ['嚴重心血管疾病風險', '2型糖尿病高風險', '睡眠呼吸中止症', '某些癌症風險'];
    }
    return ['健康風險較低'];
  }

  private getRecommendations(bmi: number, categoryCode: string): string[] {
    switch (categoryCode) {
      case 'underweight':
        return [
          '增加健康熱量攝取',
          '諮詢營養師制定增重計畫',
          '進行適度的重量訓練',
          '定期監測體重變化'
        ];
      case 'normal':
        return [
          '維持均衡飲食',
          '保持規律運動',
          '定期健康檢查',
          '維持健康的生活方式'
        ];
      case 'overweight':
        return [
          '控制熱量攝取',
          '增加運動頻率和強度',
          '諮詢營養師制定減重計畫',
          '設定合理的減重目標'
        ];
      case 'obese':
        return [
          '諮詢醫生制定綜合減重計畫',
          '採用低熱量、均衡飲食',
          '進行適合的有氧運動',
          '考慮專業醫療介入',
          '定期監測健康指標'
        ];
      default:
        return ['建議諮詢專業醫療人員'];
    }
  }

  async saveBMIRecord(userId: string, request: BMICalculationRequest, result: BMICalculationResult): Promise<BMIRecord> {
    try {
      return await this.bmiModel.create(userId, { ...request, ...result });
    } catch (error) {
      logger.error('Save BMI record service error:', error);
      throw new Error('Failed to save BMI record');
    }
  }

  async getUserBMIHistory(userId: string, limit: number = 50): Promise<BMIRecord[]> {
    try {
      return await this.bmiModel.findByUserId(userId, limit);
    } catch (error) {
      logger.error('Get BMI history service error:', error);
      throw new Error('Failed to get BMI history');
    }
  }

  async getLatestBMI(userId: string): Promise<BMIRecord | null> {
    try {
      return await this.bmiModel.findLatestByUserId(userId);
    } catch (error) {
      logger.error('Get latest BMI service error:', error);
      throw new Error('Failed to get latest BMI');
    }
  }

  async deleteBMIRecord(recordId: string, userId: string): Promise<boolean> {
    try {
      return await this.bmiModel.delete(recordId, userId);
    } catch (error) {
      logger.error('Delete BMI record service error:', error);
      throw new Error('Failed to delete BMI record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      return await this.bmiModel.clearUserHistory(userId);
    } catch (error) {
      logger.error('Clear BMI history service error:', error);
      throw new Error('Failed to clear BMI history');
    }
  }

  async getUserStats(userId: string) {
    try {
      const recordCount = await this.bmiModel.getRecordCount(userId);
      const latestRecord = await this.bmiModel.findLatestByUserId(userId);
      const averageBMI = await this.bmiModel.getAverageBMI(userId);
      
      return {
        totalRecords: recordCount,
        latestBMI: latestRecord?.bmi || null,
        latestCategory: latestRecord?.category || null,
        averageBMI: averageBMI,
        lastCalculated: latestRecord?.created_at || null,
        trend: await this.getBMITrend(userId)
      };
    } catch (error) {
      logger.error('Get BMI stats service error:', error);
      throw new Error('Failed to get BMI stats');
    }
  }

  private async getBMITrend(userId: string): Promise<string> {
    try {
      const recentRecords = await this.bmiModel.findByUserId(userId, 5);
      if (recentRecords.length < 2) return 'insufficient_data';
      
      const latest = recentRecords[0].bmi;
      const previous = recentRecords[1].bmi;
      
      if (latest > previous + 0.5) return 'increasing';
      if (latest < previous - 0.5) return 'decreasing';
      return 'stable';
    } catch (error) {
      return 'unknown';
    }
  }

  async validateBMIData(request: BMICalculationRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.height || request.height < 50 || request.height > 300) {
      errors.push('身高必須在 50-300cm 之間');
    }

    if (!request.weight || request.weight < 10 || request.weight > 500) {
      errors.push('體重必須在 10-500kg 之間');
    }

    if (request.age && (request.age < 1 || request.age > 150)) {
      errors.push('年齡必須在 1-150 歲之間');
    }

    if (request.gender && !['male', 'female'].includes(request.gender)) {
      errors.push('性別必須是 male 或 female');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
