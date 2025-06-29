import { query } from '../database/connection';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';
import { LoginRequest, SessionUser, LoginResponse } from '../types/auth.types';

export class AuthService {
  async login(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      logger.info('Login attempt for:', credentials.username);
      
      // 查詢用戶
      const result = await query(
        'SELECT id, username, password_hash, name, avatar_url, is_active FROM users WHERE username = $1 AND is_active = true',
        [credentials.username]
      );
      
      if (result.rows.length === 0) {
        logger.warn('User not found:', credentials.username);
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }
      
      const user = result.rows[0];
      
      // 驗證密碼
      const isValidPassword = await EncryptionUtil.verifyPassword(credentials.password, user.password_hash);
      
      if (!isValidPassword) {
        logger.warn('Invalid password for user:', credentials.username);
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }
      
      // 記錄登錄活動
      await query(
        'INSERT INTO activity_logs (user_id, action_type, action_description, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'LOGIN', 'User login successful', ipAddress, userAgent]
      );
      
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: new Date()
      };
      
      logger.info('Login successful for user:', credentials.username);
      
      return {
        success: true,
        message: 'Login successful',
        user: sessionUser
      };
      
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  async adminLogin(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    logger.info('Admin login attempt for:', credentials.username);
    
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return {
        success: true,
        message: 'Admin login successful'
      };
    }
    
    return {
      success: false,
      message: 'Invalid admin credentials'
    };
  }

  async logout(userId: string, ip?: string, userAgent?: string): Promise<void> {
    logger.info('Logout for user:', userId);
  }

  async adminLogout(ipAddress?: string, userAgent?: string): Promise<void> {
    logger.info('Admin logout');
  }

  async getUserInfo(userId: string): Promise<SessionUser | null> {
    logger.info('Getting user info for:', userId);
    return null;
  }

  async validateSession(user: SessionUser): Promise<boolean> {
    logger.info('Validating session for user:', user.id);
    return true;
  }
}
