// backend/src/services/admin.service.ts
import { UserModel } from '../models/User';
import { PermissionModel } from '../models/Permission';
import { ActivityLogModel } from '../models/ActivityLog';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { CreateUserRequest, UpdateUserRequest } from '../types/user.types';
import { GrantPermissionRequest, RevokePermissionRequest } from '../types/project.types';

export class AdminService {
  private userModel: UserModel;
  private permissionModel: PermissionModel;
  private activityLogModel: ActivityLogModel;

  constructor() {
    this.userModel = new UserModel();
    this.permissionModel = new PermissionModel();
    this.activityLogModel = new ActivityLogModel();
  }

  // ===== 用戶管理 =====

  // 創建新用戶
  async createUser(userData: CreateUserRequest, adminIp?: string) {
    try {
      // 檢查用戶名是否已存在
      const existingUser = await this.userModel.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // 加密密碼
      const passwordHash = await EncryptionUtil.hashPassword(userData.password);

      // 創建用戶
      const newUser = await this.userModel.create({
        ...userData,
        password_hash: passwordHash
      });

      // 記錄活動
      await this.activityLogModel.logUserManagement('CREATE', newUser.id, undefined, adminIp);

      logger.info(`New user created by admin: ${newUser.username} (${newUser.id})`);
      return newUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // 獲取用戶列表
  async getUserList(page: number = 1, limit: number = 20, sort: string = 'created_at', order: 'asc' | 'desc' = 'desc') {
    try {
      return await this.userModel.getList(page, limit, sort, order);
    } catch (error) {
      logger.error('Error getting user list:', error);
      throw new Error('Failed to get user list');
    }
  }

  // 更新用戶
  async updateUser(userId: string, updateData: UpdateUserRequest, adminIp?: string) {
    try {
      const dataToUpdate: UpdateUserRequest & { password_hash?: string } = { ...updateData };

      // 如果要更新密碼，先加密
      if (updateData.password) {
        dataToUpdate.password_hash = await EncryptionUtil.hashPassword(updateData.password);
        delete dataToUpdate.password;
      }

      const updatedUser = await this.userModel.update(userId, dataToUpdate);
      if (!updatedUser) {
        throw new Error('User not found');
      }

      // 記錄活動
      await this.activityLogModel.logUserManagement('UPDATE', userId, undefined, adminIp);

      logger.info(`User updated by admin: ${updatedUser.username} (${updatedUser.id})`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // 刪除用戶
  async deleteUser(userId: string, adminIp?: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const success = await this.userModel.delete(userId);
      if (!success) {
        throw new Error('Failed to delete user');
      }

      // 記錄活動
      await this.activityLogModel.logUserManagement('DELETE', userId, undefined, adminIp);

      logger.info(`User deleted by admin: ${user.username} (${userId})`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ===== 權限管理 =====

  // 授予權限
  async grantPermission(request: GrantPermissionRequest, adminIp?: string) {
    try {
      const success = await this.permissionModel.grantPermission(
        request.user_id,
        request.project_id,
        'admin'
      );

      if (!success) {
        throw new Error('Permission already exists or failed to grant');
      }

      // 獲取項目資訊用於記錄
      const user = await this.userModel.findById(request.user_id);
      
      // 記錄活動 - 這裡簡化處理，實際需要查詢 project_key
      await this.activityLogModel.logPermissionChange(
        'GRANT',
        request.user_id,
        'project', // 實際應該查詢具體的 project_key
        undefined,
        adminIp
      );

      logger.info(`Permission granted by admin for user ${request.user_id} on project ${request.project_id}`);
      return true;
    } catch (error) {
      logger.error('Error granting permission:', error);
      throw error;
    }
  }

  // 撤銷權限
  async revokePermission(request: RevokePermissionRequest, adminIp?: string) {
    try {
      const success = await this.permissionModel.revokePermission(
        request.user_id,
        request.project_id
      );

      if (!success) {
        throw new Error('Permission not found or failed to revoke');
      }

      // 記錄活動
      await this.activityLogModel.logPermissionChange(
        'REVOKE',
        request.user_id,
        'project', // 實際應該查詢具體的 project_key
        undefined,
        adminIp
      );

      logger.info(`Permission revoked by admin for user ${request.user_id} on project ${request.project_id}`);
      return true;
    } catch (error) {
      logger.error('Error revoking permission:', error);
      throw error;
    }
  }

  // 獲取所有權限設定
  async getAllPermissions(page: number = 1, limit: number = 20) {
    try {
      return await this.permissionModel.getAllPermissions(page, limit);
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw new Error('Failed to get permissions');
    }
  }

  // ===== 活動記錄管理 =====

  // 獲取活動記錄
  async getActivityLogs(
    page: number = 1,
    limit: number = 20,
    userId?: string,
    actionType?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      return await this.activityLogModel.getList(page, limit, userId, actionType, startDate, endDate);
    } catch (error) {
      logger.error('Error getting activity logs:', error);
      throw new Error('Failed to get activity logs');
    }
  }

  // 清理舊記錄
  async cleanOldLogs(daysToKeep: number = 90) {
    try {
      const deletedCount = await this.activityLogModel.cleanOldLogs(daysToKeep);
      logger.info(`Admin cleaned ${deletedCount} old activity logs`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old logs:', error);
      throw new Error('Failed to clean old logs');
    }
  }
}

// ===== BMI 計算服務 =====
// backend/src/services/projects/bmi.service.ts
import { BMIRecordModel } from '../../models/projects/BMIRecord';
import { ActivityLogModel } from '../../models/ActivityLog';
import { logger } from '../../utils/logger';
import { BMICalculationRequest, BMICalculationResponse } from '../../types/project.types';

export class BMIService {
  private bmiRecordModel: BMIRecordModel;
  private activityLogModel: ActivityLogModel;

  constructor() {
    this.bmiRecordModel = new BMIRecordModel();
    this.activityLogModel = new ActivityLogModel();
  }

  // 計算 BMI
  calculateBMI(height: number, weight: number): { bmi: number; category: string; description: string } {
    // BMI = 體重(kg) / 身高(m)²
    const heightInMeters = height / 100;
    const bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;

    let category: string;
    let description: string;

    if (bmi < 18.5) {
      category = 'underweight';
      description = '體重過輕，建議諮詢營養師增加體重';
    } else if (bmi < 24) {
      category = 'normal';
      description = '體重正常，請維持健康的生活方式';
    } else if (bmi < 27) {
      category = 'overweight';
      description = '體重過重，建議控制飲食並增加運動';
    } else if (bmi < 30) {
      category = 'obese_mild';
      description = '輕度肥胖，建議尋求專業指導改善體重';
    } else if (bmi < 35) {
      category = 'obese_moderate';
      description = '中度肥胖，強烈建議諮詢醫師或營養師';
    } else {
      category = 'obese_severe';
      description = '重度肥胖，請立即尋求醫療協助';
    }

    return { bmi, category, description };
  }

  // 執行 BMI 計算並保存記錄
  async performCalculation(
    userId: string,
    data: BMICalculationRequest,
    ipAddress?: string
  ): Promise<BMICalculationResponse> {
    try {
      // 計算 BMI
      const { bmi, category, description } = this.calculateBMI(data.height, data.weight);

      // 保存記錄
      const record = await this.bmiRecordModel.create(userId, data);

      // 記錄活動
      await this.activityLogModel.logBMICalculation(userId, record.id, ipAddress);

      logger.info(`BMI calculated for user ${userId}: ${bmi} (${category})`);

      return {
        bmi,
        category,
        description,
        record_id: record.id
      };
    } catch (error) {
      logger.error('Error performing BMI calculation:', error);
      throw new Error('Failed to calculate BMI');
    }
  }

  // 獲取用戶的 BMI 記錄
  async getUserRecords(userId: string, page: number = 1, limit: number = 20) {
    try {
      return await this.bmiRecordModel.getUserRecords(userId, page, limit);
    } catch (error) {
      logger.error('Error getting BMI records:', error);
      throw new Error('Failed to get BMI records');
    }
  }

  // 獲取用戶最新記錄
  async getLatestRecord(userId: string) {
    try {
      return await this.bmiRecordModel.getLatestRecord(userId);
    } catch (error) {
      logger.error('Error getting latest BMI record:', error);
      throw new Error('Failed to get latest BMI record');
    }
  }

  // 刪除記錄
  async deleteRecord(recordId: string, userId: string) {
    try {
      const success = await this.bmiRecordModel.delete(recordId, userId);
      if (!success) {
        throw new Error('Record not found or access denied');
      }

      logger.info(`BMI record deleted: ${recordId} by user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting BMI record:', error);
      throw error;
    }
  }
}

// ===== TDEE 計算服務 =====
// backend/src/services/projects/tdee.service.ts
import { TDEERecordModel } from '../../models/projects/TDEERecord';
import { ActivityLogModel } from '../../models/ActivityLog';
import { logger } from '../../utils/logger';
import { TDEECalculationRequest, TDEECalculationResponse } from '../../types/project.types';

export class TDEEService {
  private tdeeRecordModel: TDEERecordModel;
  private activityLogModel: ActivityLogModel;

  constructor() {
    this.tdeeRecordModel = new TDEERecordModel();
    this.activityLogModel = new ActivityLogModel();
  }

  // 計算基礎代謝率 (BMR)
  private calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    // 使用 Mifflin-St Jeor 公式
    let bmr: number;
    
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    return Math.round(bmr);
  }

  // 獲取活動係數
  private getActivityFactor(activityLevel: string): number {
    const factors: Record<string, number> = {
      'sedentary': 1.2,      // 久坐不動（辦公室工作，很少運動）
      'light': 1.375,        // 輕度活動（每週1-3天輕度運動）
      'moderate': 1.55,      // 中度活動（每週3-5天中度運動）
      'active': 1.725,       // 高度活動（每週6-7天運動）
      'very_active': 1.9     // 極高活動（每天運動，體力勞動工作）
    };

    return factors[activityLevel] || 1.2;
  }

  // 獲取活動等級描述
  private getActivityDescription(activityLevel: string): string {
    const descriptions: Record<string, string> = {
      'sedentary': '久坐不動 - 辦公室工作，很少或沒有運動',
      'light': '輕度活動 - 每週1-3天輕度運動或活動',
      'moderate': '中度活動 - 每週3-5天中度運動',
      'active': '高度活動 - 每週6-7天劇烈運動',
      'very_active': '極高活動 - 每天劇烈運動，體力勞動工作'
    };

    return descriptions[activityLevel] || '未知活動等級';
  }

  // 計算 TDEE
  calculateTDEE(
    weight: number, 
    height: number, 
    age: number, 
    gender: 'male' | 'female',
    activityLevel: string
  ): { bmr: number; tdee: number; activity_factor: number; description: string } {
    
    // 計算 BMR
    const bmr = this.calculateBMR(weight, height, age, gender);
    
    // 獲取活動係數
    const activityFactor = this.getActivityFactor(activityLevel);
    
    // 計算 TDEE
    const tdee = Math.round(bmr * activityFactor);
    
    // 生成描述
    const activityDescription = this.getActivityDescription(activityLevel);
    const description = `您的基礎代謝率為 ${bmr} 大卡/天，活動等級：${activityDescription}。建議每日攝取 ${tdee} 大卡以維持當前體重。`;

    return {
      bmr,
      tdee,
      activity_factor: activityFactor,
      description
    };
  }

  // 執行 TDEE 計算並保存記錄
  async performCalculation(
    userId: string,
    data: TDEECalculationRequest,
    ipAddress?: string
  ): Promise<TDEECalculationResponse> {
    try {
      // 計算 TDEE
      const { bmr, tdee, activity_factor, description } = this.calculateTDEE(
        data.weight,
        data.height,
        data.age,
        data.gender,
        data.activity_level
      );

      // 保存記錄
      const record = await this.tdeeRecordModel.create(userId, data);

      // 記錄活動
      await this.activityLogModel.logTDEECalculation(userId, record.id, ipAddress);

      logger.info(`TDEE calculated for user ${userId}: BMR=${bmr}, TDEE=${tdee}`);

      return {
        bmr,
        tdee,
        activity_factor,
        description,
        record_id: record.id
      };
    } catch (error) {
      logger.error('Error performing TDEE calculation:', error);
      throw new Error('Failed to calculate TDEE');
    }
  }

  // 獲取用戶的 TDEE 記錄
  async getUserRecords(userId: string, page: number = 1, limit: number = 20) {
    try {
      return await this.tdeeRecordModel.getUserRecords(userId, page, limit);
    } catch (error) {
      logger.error('Error getting TDEE records:', error);
      throw new Error('Failed to get TDEE records');
    }
  }

  // 獲取用戶最新記錄
  async getLatestRecord(userId: string) {
    try {
      return await this.tdeeRecordModel.getLatestRecord(userId);
    } catch (error) {
      logger.error('Error getting latest TDEE record:', error);
      throw new Error('Failed to get latest TDEE record');
    }
  }

  // 刪除記錄
  async deleteRecord(recordId: string, userId: string) {
    try {
      const success = await this.tdeeRecordModel.delete(recordId, userId);
      if (!success) {
        throw new Error('Record not found or access denied');
      }

      logger.info(`TDEE record deleted: ${recordId} by user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting TDEE record:', error);
      throw error;
    }
  }

  // 提供建議（基於 TDEE 結果）
  getRecommendations(tdee: number, bmr: number): {
    weightLoss: number;
    weightGain: number;
    maintenance: number;
    recommendations: string[];
  } {
    const weightLoss = Math.round(tdee - 500); // 減重：每日減少500大卡
    const weightGain = Math.round(tdee + 300);  // 增重：每日增加300大卡
    const maintenance = tdee;                    // 維持：等於 TDEE

    const recommendations = [
      `維持體重：每日攝取 ${maintenance} 大卡`,
      `健康減重：每日攝取 ${weightLoss} 大卡（每週約減重0.5公斤）`,
      `健康增重：每日攝取 ${weightGain} 大卡（配合阻力訓練）`,
      `基礎代謝：${bmr} 大卡是您的最低熱量需求，請勿低於此數值`,
      '建議搭配均衡飲食和適度運動以達到最佳效果'
    ];

    return {
      weightLoss,
      weightGain,
      maintenance,
      recommendations
    };
  }
}