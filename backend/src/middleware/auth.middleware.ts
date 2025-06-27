// backend/src/middleware/auth.middleware.ts - 修復 TypeScript 類型錯誤
import { Request, Response, NextFunction } from 'express';
import { SessionUser } from '../types/auth.types';
import { logger } from '../utils/logger';

// 認證中間件 - 檢查用戶或管理員登錄
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 檢查用戶登錄
    if (req.session?.user) {
      req.user = req.session.user;
      req.isAdmin = false;
      
      logger.debug('User authenticated', {
        userId: req.user.id,
        username: req.user.username,
        path: req.path
      });
      
      return next();
    }

    // 檢查管理員登錄
    if (req.session?.isAdmin) {
      req.isAdmin = true;
      
      logger.debug('Admin authenticated', {
        path: req.path,
        adminUser: req.session.adminUser
      });
      
      return next();
    }

    // 未登錄
    logger.warn('Authentication required', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

// 用戶認證中間件 - 只允許登錄用戶
export const userAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.user) {
      logger.warn('User authentication required', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'User authentication required',
        code: 'USER_AUTH_REQUIRED'
      });
    }

    req.user = req.session.user;
    req.isAdmin = false;

    logger.debug('User authenticated', {
      userId: req.user.id,
      username: req.user.username,
      path: req.path
    });

    return next();
  } catch (error) {
    logger.error('User auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'USER_AUTH_MIDDLEWARE_ERROR'
    });
  }
};

// 可選認證中間件 - 不強制要求登錄，但會設置用戶信息
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session?.user) {
      req.user = req.session.user;
      req.isAdmin = false;
    } else if (req.session?.isAdmin) {
      req.isAdmin = true;
    }

    return next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    return next(); // 繼續執行，不阻止請求
  }
};

// 驗證用戶是否啟用
export const activeUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && !req.user.is_active) {
      logger.warn('Inactive user attempted access', {
        userId: req.user.id,
        username: req.user.username,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: 'Account is disabled. Please contact administrator.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    return next();
  } catch (error) {
    logger.error('Active user middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'User validation error',
      code: 'USER_VALIDATION_ERROR'
    });
  }
};