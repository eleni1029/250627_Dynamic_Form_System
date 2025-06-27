// backend/src/services/auth.service.ts - 生產版本
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

      // 登錄成功 - 創建 SessionUser 對象，包含所有必需屬性
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
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
  async adminLogin(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { username, password } = credentials;

      // 檢查管理員憑證
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== adminUsername || password !== adminPassword) {
        logger.warn(`Admin login attempt with invalid credentials: ${username}`, { ipAddress });
        
        // 記錄失敗的管理員登錄嘗試
        await this.activityLogModel.create({
          action_type: 'ADMIN_LOGIN_FAILED',
          action_description: `Admin login failed - invalid credentials (${username})`,
          ip_address: ipAddress,
          user_agent: userAgent
        });

        return {
          success: false,
          message: 'Invalid administrator credentials'
        };
      }

      // 記錄成功的管理員登錄
      await this.activityLogModel.logAdminLogin(ipAddress, userAgent);

      logger.info('Admin logged in successfully', { 
        username: adminUsername, 
        ipAddress 
      });

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
      await this.activityLogModel.logAdminLogout(ipAddress, userAgent);
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
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      logger.error('Get user info error:', error);
      return null;
    }
  }

  // 管理員密碼驗證（用於敏感操作）
  async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      return password === adminPassword;
    } catch (error) {
      logger.error('Admin password verification error:', error);
      return false;
    }
  }
}