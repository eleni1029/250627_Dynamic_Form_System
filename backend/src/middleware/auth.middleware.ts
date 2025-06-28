import { Request, Response, NextFunction } from 'express';
import { SessionUser } from '../types/auth.types';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
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

    if (req.session?.isAdmin) {
      req.isAdmin = true;
      
      logger.debug('Admin authenticated', {
        path: req.path,
        adminUser: req.session.adminUser
      });
      
      return next();
    }

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
