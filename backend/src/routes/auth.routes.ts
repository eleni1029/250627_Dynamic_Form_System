import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

const router = Router();
let authService: AuthService;

function getAuthService(): AuthService {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

// 用戶登錄
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    const loginData = { username, password };
    const result = await getAuthService().login(loginData, ipAddress, userAgent);

    if (result.success && result.user) {
      req.session.user = result.user;
      req.session.isAdmin = false;

      logger.info('User login successful', {
        userId: result.user.id,
        username: result.user.username,
        ip: ipAddress
      });

      res.json({
        success: true,
        message: result.message,
        user: result.user
      });
      return;
    } else {
      logger.warn('User login failed', {
        username,
        ip: ipAddress,
        reason: result.message
      });

      res.status(401).json({
        success: false,
        error: result.message || 'Invalid username or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login',
      code: 'LOGIN_SERVER_ERROR'
    });
    return;
  }
});

// 管理員登錄
router.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    const loginData = { username, password };
    const result = await getAuthService().adminLogin(loginData, ipAddress, userAgent);

    if (result.success) {
      req.session.isAdmin = true;
      req.session.adminUser = {
        username: username,
        loginTime: new Date()
      };

      logger.info('Admin login successful', {
        username,
        ip: ipAddress
      });

      res.json({
        success: true,
        message: result.message,
        isAdmin: true
      });
      return;
    } else {
      logger.warn('Admin login failed', {
        username,
        ip: ipAddress,
        reason: result.message
      });

      res.status(401).json({
        success: false,
        error: result.message,
        code: 'INVALID_ADMIN_CREDENTIALS'
      });
      return;
    }
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during admin login',
      code: 'ADMIN_LOGIN_SERVER_ERROR'
    });
    return;
  }
});

// 登出
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (req.session.user) {
      await getAuthService().logout(req.session.user.id, ipAddress, userAgent);
      logger.info('User logout', {
        userId: req.session.user.id,
        ip: ipAddress
      });
    } else if (req.session.isAdmin) {
      await getAuthService().adminLogout(ipAddress, userAgent);
      logger.info('Admin logout', { ip: ipAddress });
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to logout',
          code: 'LOGOUT_ERROR'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      return;
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout',
      code: 'LOGOUT_SERVER_ERROR'
    });
    return;
  }
});

// 獲取認證狀態
router.get('/status', (req: Request, res: Response): void => {
  try {
    const authenticated = !!(req.session?.user || req.session?.isAdmin);
    const isAdmin = !!req.session?.isAdmin;
    const user = req.session?.user || null;

    res.json({
      success: true,
      data: {
        isAuthenticated: authenticated,
        isAdmin: isAdmin,
        user: user,
        adminUser: req.session?.adminUser || null
      }
    });
  } catch (error) {
    logger.error('Auth status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auth status',
      code: 'AUTH_STATUS_ERROR'
    });
  }
});

export default router;
