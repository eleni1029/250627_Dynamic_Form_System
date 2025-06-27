// backend/src/services/auth.service.ts
import { UserModel } from '../models/User';
import { ActivityLogModel } from '../models/ActivityLog';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { LoginRequest, LoginResponse, SessionUser } from '../types/auth.types';

export class AuthService {
  private userModel: UserModel;
  private activityLogModel: ActivityLogModel;

  constructor() {
    this.userModel = new UserModel();
    this.activityLogModel = new ActivityLogModel();
  }

  // 用戶登錄
  async login(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      const { username, password } = credentials;

      // 查找用戶
      const user = await this.userModel.findByUsername(username);
      if (!user) {
        logger.warn(`Login attempt with non-existent username: ${username}`, { ipAddress });
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // 檢查用戶是否啟用
      if (!user.is_active) {
        logger.warn(`Login attempt with deactivated account: ${username}`, { ipAddress });
        await this.activityLogModel.create({
          user_id: user.id,
          action_type: 'LOGIN_FAILED',
          action_description: 'Login failed - account deactivated',
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return {
          success: false,
          message: 'Account has been deactivated. Please contact administrator.'
        };
      }

      // 驗證密碼
      const isPasswordValid = await EncryptionUtil.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        logger.warn(`Login attempt with invalid password: ${username}`, { ipAddress });
        await this.activityLogModel.create({
          user_id: user.id,
          action_type: 'LOGIN_FAILED',
          action_description: 'Login failed - invalid password',
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // 登錄成功
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        is_active: user.is_active
      };

      // 記錄登錄活動
      await this.activityLogModel.logLogin(user.id, ipAddress, userAgent);

      logger.info(`User logged in successfully: ${username} (${user.id})`, { ipAddress });

      return {
        success: true,
        user: sessionUser,
        message: 'Login successful'
      };
    } catch (error) {
      logger.error('Login service error:', error);
      return {
        success: false,
        message: 'An error occurred during login. Please try again.'
      };
    }
  }

  // 管理員登錄
  async adminLogin(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      const { username, password } = credentials;

      // 檢查管理員憑證
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        logger.error('Admin credentials not configured in environment variables');
        return {
          success: false,
          message: 'Admin authentication not configured'
        };
      }

      if (username !== adminUsername || password !== adminPassword) {
        logger.warn(`Admin login attempt with invalid credentials: ${username}`, { ipAddress });
        await this.activityLogModel.create({
          action_type: 'ADMIN_LOGIN_FAILED',
          action_description: 'Admin login failed - invalid credentials',
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return {
          success: false,
          message: 'Invalid admin credentials'
        };
      }

      // 管理員登錄成功
      await this.activityLogModel.logAdminLogin(ipAddress, userAgent);

      logger.info('Admin logged in successfully', { ipAddress });

      return {
        success: true,
        message: 'Admin login successful'
      };
    } catch (error) {
      logger.error('Admin login service error:', error);
      return {
        success: false,
        message: 'An error occurred during admin login. Please try again.'
      };
    }
  }

  // 用戶登出
  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.activityLogModel.logLogout(userId, ipAddress, userAgent);
      logger.info(`User logged out: ${userId}`, { ipAddress });
    } catch (error) {
      logger.error('Logout service error:', error);
    }
  }

  // 管理員登出
  async adminLogout(ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.activityLogModel.create({
        action_type: 'ADMIN_LOGOUT',
        action_description: 'Administrator logged out',
        ip_address: ipAddress,
        user_agent: userAgent
      });
      logger.info('Admin logged out', { ipAddress });
    } catch (error) {
      logger.error('Admin logout service error:', error);
    }
  }

  // 驗證用戶 session
  async validateSession(sessionUser: SessionUser): Promise<boolean> {
    try {
      const user = await this.userModel.findById(sessionUser.id);
      return user !== null && user.is_active;
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }

  // 獲取用戶資訊（用於更新 session）
  async getUserInfo(userId: string): Promise<SessionUser | null> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        is_active: user.is_active
      };
    } catch (error) {
      logger.error('Get user info error:', error);
      return null;
    }
  }
}

// ===== 用戶服務 =====
// backend/src/services/user.service.ts
import { UserModel } from '../models/User';
import { PermissionModel } from '../models/Permission';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { CreateUserRequest, UpdateUserRequest, UserWithPermissions } from '../types/user.types';

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