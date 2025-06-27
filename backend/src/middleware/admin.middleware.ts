// backend/src/middleware/admin.middleware.ts - 修復 TypeScript 類型錯誤
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 管理員認證中間件
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 檢查是否為管理員登錄
    if (!req.session?.isAdmin) {
      logger.warn('Admin authentication required', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        isAdmin: !!req.session?.isAdmin
      });

      return res.status(403).json({
        success: false,
        error: 'Administrator access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    // 設置管理員標識
    req.isAdmin = true;

    logger.debug('Admin authenticated', {
      path: req.path,
      method: req.method,
      adminUser: req.session.adminUser || { username: 'admin' },
      ip: req.ip
    });

    return next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization error',
      code: 'ADMIN_MIDDLEWARE_ERROR'
    });
  }
};

// 記錄管理員操作的中間件
export const adminActionLogMiddleware = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        // 記錄管理員操作
        logger.info('Admin operation completed', {
          action,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          body: req.body,
          params: req.params,
          query: req.query
        });

        return originalSend.call(this, data);
      };

      return next();
    } catch (error) {
      logger.error('Admin action log middleware error:', error);
      return next(); // 不阻止請求繼續
    }
  };
};

// 管理員認證 + 操作記錄組合中間件
export const adminWithLogging = (action: string) => {
  return [
    adminMiddleware,
    adminActionLogMiddleware(action)
  ];
};