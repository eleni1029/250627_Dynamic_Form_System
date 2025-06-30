#!/bin/bash

echo "🔧 模組化修復 Part 1 - 後端 Services 層"
echo "========================================"

# ===== 創建目錄結構 =====
echo "📁 創建目錄結構..."

mkdir -p backend/src/projects/{bmi,tdee}/{controllers,services,models,types,middleware}
mkdir -p backend/src/{middleware,types,utils,config,database/{migrations,seeds}}
mkdir -p frontend/src/projects/{bmi,tdee}/{components,stores,api,types,views}
mkdir -p frontend/src/shared/{components,stores,utils,types}

# ===== BMI Service =====
echo "📝 創建 BMIService..."

cat > backend/src/projects/bmi/services/BMIService.ts << 'EOF'
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
EOF

echo "✅ BMI Service 已創建"

# ===== TDEE Service =====
echo "📝 創建 TDEE Service..."

cat > backend/src/projects/tdee/services/TDEEService.ts << 'EOF'
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
EOF

echo "✅ TDEE Service 已創建"
echo "✅ Part 1 完成 - Services 層已建立"