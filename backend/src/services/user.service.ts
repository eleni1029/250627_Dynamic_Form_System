// backend/src/services/user.service.ts - 完整版本
import { UserModel } from '../models/User';
import { PermissionModel } from '../models/Permission';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { CreateUserRequest, UpdateUserRequest, UserWithPermissions } from '../types/auth.types';

export class UserService {
  private userModel: UserModel;
  private permissionModel: PermissionModel;

  constructor() {
    this.userModel = new UserModel();
    this.permissionModel = new PermissionModel();
  }

  // 獲取用戶資訊（含權限）
  async getUserWithPermissions(userId: string): Promise<UserWithPermissions | null> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) return null;

      const permissions = await this.userModel.getUserPermissions(userId);

      return {
        ...user,
        permissions
      };
    } catch (error) {
      logger.error('Error getting user with permissions:', error);
      throw new Error('Failed to get user information');
    }
  }

  // 檢查用戶專案權限
  async hasProjectPermission(userId: string, projectKey: string): Promise<boolean> {
    try {
      return await this.permissionModel.hasPermission(userId, projectKey);
    } catch (error) {
      logger.error('Error checking project permission:', error);
      return false;
    }
  }

  // 獲取用戶可訪問的專案列表
  async getUserProjects(userId: string) {
    try {
      return await this.permissionModel.getUserPermissions(userId);
    } catch (error) {
      logger.error('Error getting user projects:', error);
      throw new Error('Failed to get user projects');
    }
  }

  // 更新用戶資訊
  async updateUser(userId: string, updateData: UpdateUserRequest) {
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

      logger.info(`User updated: ${updatedUser.username} (${updatedUser.id})`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // 更新用戶頭像
  async updateAvatar(userId: string, avatarUrl: string) {
    try {
      const updatedUser = await this.userModel.updateAvatar(userId, avatarUrl);
      if (!updatedUser) {
        throw new Error('User not found');
      }

      logger.info(`User avatar updated: ${updatedUser.username} (${updatedUser.id})`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw error;
    }
  }
}