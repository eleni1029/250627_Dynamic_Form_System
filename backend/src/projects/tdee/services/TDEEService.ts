import { TDEEModel, TDEECalculationRequest, TDEECalculationResult, TDEERecord } from '../models/TDEERecord';
import { ACTIVITY_LEVELS } from '../types/tdee.types';
import { logger } from '../../../utils/logger';

export class TDEEService {
  private tdeeModel: TDEEModel;

  constructor() {
    this.tdeeModel = new TDEEModel();
  }

  async calculateTDEE(request: TDEECalculationRequest): Promise<TDEECalculationResult> {
    try {
      const { height, weight, age, gender, activity_level } = request;
      
      // 計算 BMR 使用 Mifflin-St Jeor Equation
      let bmr: number;
      if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }

      // 計算 TDEE
      const activityInfo = ACTIVITY_LEVELS[activity_level];
      const tdee = bmr * activityInfo.multiplier;

      return {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        activityInfo: {
          level: activity_level,
          multiplier: activityInfo.multiplier,
          description: activityInfo.description,
          name: activityInfo.name
        },
        macronutrients: this.calculateMacros(tdee),
        recommendations: this.getRecommendations(bmr, tdee, activity_level),
        calorieGoals: this.calculateCalorieGoals(tdee),
        nutritionAdvice: this.getNutritionAdvice(age, gender, activity_level)
      };
    } catch (error) {
      logger.error('TDEE calculation service error:', error);
      throw new Error('Failed to calculate TDEE');
    }
  }

  private calculateMacros(tdee: number) {
    // 計算建議的宏營養素分配 (蛋白質25%, 脂肪25%, 碳水50%)
    const proteinCalories = tdee * 0.25;
    const fatCalories = tdee * 0.25;
    const carbCalories = tdee * 0.50;

    return {
      protein: {
        calories: Math.round(proteinCalories),
        grams: Math.round(proteinCalories / 4),
        percentage: 25
      },
      fat: {
        calories: Math.round(fatCalories),
        grams: Math.round(fatCalories / 9),
        percentage: 25
      },
      carbs: {
        calories: Math.round(carbCalories),
        grams: Math.round(carbCalories / 4),
        percentage: 50
      }
    };
  }

  private calculateCalorieGoals(tdee: number) {
    return {
      maintenance: tdee,
      mildWeightLoss: tdee - Math.round(tdee * 0.10), // 10% 赤字
      moderateWeightLoss: tdee - Math.round(tdee * 0.20), // 20% 赤字
      aggressiveWeightLoss: tdee - Math.round(tdee * 0.25), // 25% 赤字
      mildWeightGain: tdee + Math.round(tdee * 0.05), // 5% 盈餘
      moderateWeightGain: tdee + Math.round(tdee * 0.10), // 10% 盈餘
      aggressiveWeightGain: tdee + Math.round(tdee * 0.15) // 15% 盈餘
    };
  }

  private getRecommendations(bmr: number, tdee: number, activityLevel: string) {
    const recommendations = {
      general: [
        '維持規律的飲食時間',
        '充足的水分攝取（每天至少2公升）',
        '保證充足的睡眠（7-9小時）',
        '定期監測體重和身體組成'
      ],
      activity: this.getActivityAdvice(activityLevel),
      nutrition: [
        '優先選擇原型食物',
        '控制加工食品攝取',
        '均衡攝取各類營養素',
        '適量攝取膳食纖維'
      ],
      warnings: []
    };

    // 添加特殊警告
    const minCalories = gender === 'male' ? 1500 : 1200;
    if (tdee * 0.75 < minCalories) {
      recommendations.warnings.push('建議卡路里攝取不應低於基礎代謝率');
    }

    return recommendations;
  }

  private getActivityAdvice(activityLevel: string): string[] {
    const advice: Record<string, string[]> = {
      sedentary: [
        '建議增加日常活動量',
        '每天至少步行30分鐘',
        '減少久坐時間',
        '嘗試樓梯代替電梯'
      ],
      light: [
        '保持當前活動水平',
        '可考慮增加運動強度',
        '每週2-3次力量訓練',
        '增加戶外活動時間'
      ],
      moderate: [
        '良好的活動水平',
        '建議維持規律運動',
        '注意運動與休息的平衡',
        '可嘗試不同類型的運動'
      ],
      active: [
        '優秀的活動水平',
        '注意適度休息和恢復',
        '確保運動多樣性',
        '注意運動傷害預防'
      ],
      very_active: [
        '極高活動水平',
        '確保充足營養攝取',
        '重視恢復和休息',
        '定期監測身體狀況',
        '避免過度訓練'
      ]
    };
    return advice[activityLevel] || ['請諮詢專業人士'];
  }

  private getNutritionAdvice(age: number, gender: string, activityLevel: string): string[] {
    const advice: string[] = [];

    if (age < 18) {
      advice.push('青少年需要額外的營養支持成長發育');
      advice.push('建議諮詢兒童營養師');
    } else if (age > 65) {
      advice.push('年長者需要注意蛋白質攝取');
      advice.push('補充維生素D和鈣質');
      advice.push('注意水分攝取');
    }

    if (gender === 'female') {
      advice.push('注意鐵質攝取');
      advice.push('確保足夠的葉酸攝取');
    }

    if (['active', 'very_active'].includes(activityLevel)) {
      advice.push('運動前後適當補充碳水化合物');
      advice.push('運動後30分鐘內補充蛋白質');
      advice.push('注意電解質平衡');
    }

    return advice;
  }

  async saveTDEERecord(userId: string, request: TDEECalculationRequest, result: TDEECalculationResult): Promise<TDEERecord> {
    try {
      return await this.tdeeModel.create(userId, { ...request, ...result });
    } catch (error) {
      logger.error('Save TDEE record service error:', error);
      throw new Error('Failed to save TDEE record');
    }
  }

  async getUserTDEEHistory(userId: string, limit: number = 50): Promise<TDEERecord[]> {
    try {
      return await this.tdeeModel.findByUserId(userId, limit);
    } catch (error) {
      logger.error('Get TDEE history service error:', error);
      throw new Error('Failed to get TDEE history');
    }
  }

  async getLatestTDEE(userId: string): Promise<TDEERecord | null> {
    try {
      return await this.tdeeModel.findLatestByUserId(userId);
    } catch (error) {
      logger.error('Get latest TDEE service error:', error);
      throw new Error('Failed to get latest TDEE');
    }
  }

  getActivityLevels() {
    return Object.entries(ACTIVITY_LEVELS).map(([key, value]) => ({
      value: key,
      label: value.name,
      description: value.description,
      multiplier: value.multiplier
    }));
  }

  async deleteTDEERecord(recordId: string, userId: string): Promise<boolean> {
    try {
      return await this.tdeeModel.delete(recordId, userId);
    } catch (error) {
      logger.error('Delete TDEE record service error:', error);
      throw new Error('Failed to delete TDEE record');
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      return await this.tdeeModel.clearUserHistory(userId);
    } catch (error) {
      logger.error('Clear TDEE history service error:', error);
      throw new Error('Failed to clear TDEE history');
    }
  }

  async getUserStats(userId: string) {
    try {
      const recordCount = await this.tdeeModel.getRecordCount(userId);
      const latestRecord = await this.tdeeModel.findLatestByUserId(userId);
      const averageTDEE = await this.tdeeModel.getAverageTDEE(userId);
      
      return {
        totalCalculations: recordCount,
        latestTDEE: latestRecord?.tdee || null,
        latestBMR: latestRecord?.bmr || null,
        averageTDEE: averageTDEE,
        mostUsedActivityLevel: await this.getMostUsedActivityLevel(userId),
        lastCalculated: latestRecord?.created_at || null,
        tdeeRange: await this.getTDEERange(userId),
        bmrTrend: await this.getBMRTrend(userId)
      };
    } catch (error) {
      logger.error('Get TDEE stats service error:', error);
      throw new Error('Failed to get TDEE stats');
    }
  }

  private async getMostUsedActivityLevel(userId: string): Promise<string> {
    try {
      return await this.tdeeModel.getMostUsedActivityLevel(userId);
    } catch (error) {
      return 'moderate';
    }
  }

  private async getTDEERange(userId: string): Promise<{ min: number; max: number } | null> {
    try {
      return await this.tdeeModel.getTDEERange(userId);
    } catch (error) {
      return null;
    }
  }

  private async getBMRTrend(userId: string): Promise<string> {
    try {
      const recentRecords = await this.tdeeModel.findByUserId(userId, 5);
      if (recentRecords.length < 2) return 'insufficient_data';
      
      const latest = recentRecords[0].bmr;
      const previous = recentRecords[1].bmr;
      
      if (latest > previous + 50) return 'increasing';
      if (latest < previous - 50) return 'decreasing';
      return 'stable';
    } catch (error) {
      return 'unknown';
    }
  }

  async validateTDEEData(request: TDEECalculationRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.height || request.height < 50 || request.height > 300) {
      errors.push('身高必須在 50-300cm 之間');
    }

    if (!request.weight || request.weight < 10 || request.weight > 500) {
      errors.push('體重必須在 10-500kg 之間');
    }

    if (!request.age || request.age < 1 || request.age > 150) {
      errors.push('年齡必須在 1-150 歲之間');
    }

    if (!request.gender || !['male', 'female'].includes(request.gender)) {
      errors.push('性別必須是 male 或 female');
    }

    if (!request.activity_level || !ACTIVITY_LEVELS[request.activity_level]) {
      errors.push('必須選擇有效的活動等級');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
