// backend/src/services/admin.service.ts - 完整版本
import { UserModel } from '../models/User';
import { PermissionModel } from '../models/Permission';
import { ActivityLogModel } from '../models/ActivityLog';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { CreateUserRequest, UpdateUserRequest } from '../types/auth.types';
import { GrantPermissionRequest, RevokePermissionRequest } from '../types/auth.types';

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

      // 記錄活動
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