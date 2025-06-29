import { logger } from '../utils/logger';
import { LoginRequest, SessionUser, LoginResponse } from '../types/auth.types';

export class AuthService {
  async login(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    logger.info('Login attempt for:', credentials.username);
    
    // 簡化的登錄邏輯
    if (credentials.username === 'test' && credentials.password === 'test123') {
      const user: SessionUser = {
        id: '1',
        username: credentials.username,
        name: 'Test User',
        is_active: true,
        created_at: new Date()
      };
      
      return {
        success: true,
        message: 'Login successful',
        user
      };
    }
    
    return {
      success: false,
      message: 'Invalid username or password'
    };
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
