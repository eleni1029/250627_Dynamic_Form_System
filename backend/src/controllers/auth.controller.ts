// backend/src/controllers/auth.controller.ts - 認證控制器
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { LoginRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // 用戶登錄
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // 驗證請求數據
      if (!loginData.username || !loginData.password) {
        logger.warn('Login attempt with missing credentials', { 
          username: loginData.username,
          hasPassword: !!loginData.password,
          ip: ipAddress 
        });
        
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
        return;
      }

      // 檢查用戶名和密碼長度
      if (loginData.username.length > 50 || loginData.password.length > 100) {
        logger.warn('Login attempt with invalid credential length', {
          username: loginData.username,
          usernameLength: loginData.username.length,
          passwordLength: loginData.password.length,
          ip: ipAddress
        });
        
        res.status(400).json({
          success: false,
          error: 'Invalid credential format',
          code: 'INVALID_CREDENTIAL_FORMAT'
        });
        return;
      }

      // 執行登錄
      const result = await this.authService.login(loginData, ipAddress, userAgent);

      if (result.success && result.user) {
        // 登錄成功，設置 session
        req.session.user = result.user;
        req.session.save((err) => {
          if (err) {
            logger.error('Session save error during login:', err);
          }
        });

        logger.info('User login successful', {
          userId: result.user.id,
          username: result.user.username,
          ip: ipAddress
        });

        res.status(200).json({
          success: true,
          data: {
            user: {
              id: result.user.id,
              username: result.user.username,
              name: result.user.name,
              avatar_url: result.user.avatar_url
            }
          },
          message: result.message
        });
      } else {
        // 登錄失敗
        logger.warn('User login failed', {
          username: loginData.username,
          reason: result.message,
          ip: ipAddress
        });

        res.status(401).json({
          success: false,
          error: result.message,
          code: 'LOGIN_FAILED'
        });
      }
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login',
        code: 'LOGIN_SERVER_ERROR'
      });
    }
  };

  // 管理員登錄
  public adminLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // 驗證請求數據
      if (!loginData.username || !loginData.password) {
        logger.warn('Admin login attempt with missing credentials', { 
          username: loginData.username,
          hasPassword: !!loginData.password,
          ip: ipAddress 
        });
        
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
        return;
      }

      // 執行管理員登錄
      const result = await this.authService.adminLogin(loginData, ipAddress, userAgent);

      if (result.success) {
        // 管理員登錄成功，設置 session
        req.session.isAdmin = true;
        req.session.adminLastActivity = Date.now();
        req.session.save((err) => {
          if (err) {
            logger.error('Session save error during admin login:', err);
          }
        });

        logger.info('Admin login successful', {
          ip: ipAddress,
          userAgent
        });

        res.status(200).json({
          success: true,
          data: {
            admin: true,
            loginTime: new Date().toISOString()
          },
          message: result.message
        });
      } else {
        // 管理員登錄失敗
        logger.warn('Admin login failed', {
          username: loginData.username,
          reason: result.message,
          ip: ipAddress
        });

        res.status(401).json({
          success: false,
          error: result.message,
          code: 'ADMIN_LOGIN_FAILED'
        });
      }
    } catch (error) {
      logger.error('Admin login controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during admin login',
        code: 'ADMIN_LOGIN_SERVER_ERROR'
      });
    }
  };

  // 用戶登出
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // 記錄登出活動
      if (userId) {
        await this.authService.logout(userId, ipAddress, userAgent);
      }

      // 清除 session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destroy error during logout:', err);
          res.status(500).json({
            success: false,
            error: 'Error during logout',
            code: 'LOGOUT_ERROR'
          });
          return;
        }

        // 清除 session cookie
        res.clearCookie('dynamic_form_session');

        logger.info('User logout successful', {
          userId,
          ip: ipAddress
        });

        res.status(200).json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during logout',
        code: 'LOGOUT_SERVER_ERROR'
      });
    }
  };

  // 管理員登出
  public adminLogout = async (req: Request, res: Response): Promise<void> => {
    try {
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      // 記錄管理員登出活動
      await this.authService.adminLogout(ipAddress, userAgent);

      // 只清除管理員 session，保留用戶 session（如果有）
      if (req.session) {
        req.session.isAdmin = false;
        delete req.session.adminLastActivity;
        
        req.session.save((err) => {
          if (err) {
            logger.error('Session save error during admin logout:', err);
          }
        });
      }

      logger.info('Admin logout successful', {
        ip: ipAddress
      });

      res.status(200).json({
        success: true,
        message: 'Admin logout successful'
      });
    } catch (error) {
      logger.error('Admin logout controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during admin logout',
        code: 'ADMIN_LOGOUT_SERVER_ERROR'
      });
    }
  };

  // 檢查認證狀態
  public checkAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const isAdmin = req.isAdmin || false;

      if (user) {
        // 驗證用戶 session 是否仍然有效
        const isValid = await this.authService.validateSession(user);
        
        if (!isValid) {
          // Session 無效，清除
          req.session.destroy((err) => {
            if (err) {
              logger.error('Session destroy error during auth check:', err);
            }
          });

          res.status(401).json({
            success: false,
            error: 'Session expired or invalid',
            code: 'SESSION_EXPIRED'
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            authenticated: true,
            user: {
              id: user.id,
              username: user.username,
              name: user.name,
              avatar_url: user.avatar_url
            },
            isAdmin
          }
        });
      } else {
        res.status(200).json({
          success: true,
          data: {
            authenticated: false,
            isAdmin
          }
        });
      }
    } catch (error) {
      logger.error('Auth check controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during auth check',
        code: 'AUTH_CHECK_SERVER_ERROR'
      });
    }
  };

  // 刷新用戶信息
  public refreshUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      // 從資料庫獲取最新的用戶信息
      const updatedUser = await this.authService.getUserInfo(req.user.id);
      
      if (!updatedUser) {
        // 用戶不存在，清除 session
        req.session.destroy((err) => {
          if (err) {
            logger.error('Session destroy error during user refresh:', err);
          }
        });

        res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // 更新 session 中的用戶信息
      req.session.user = updatedUser;
      req.session.save((err) => {
        if (err) {
          logger.error('Session save error during user refresh:', err);
        }
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            avatar_url: updatedUser.avatar_url
          }
        },
        message: 'User information refreshed'
      });
    } catch (error) {
      logger.error('Refresh user controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during user refresh',
        code: 'REFRESH_USER_SERVER_ERROR'
      });
    }
  };
}