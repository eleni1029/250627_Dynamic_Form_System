// backend/src/routes/auth.routes.ts - 修復參數傳遞和 IP 解析
import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

// 延遲初始化服務，避免在資料庫連接前實例化
let authService: AuthService;

function getAuthService(): AuthService {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

// ===== 核心認證 API =====

// 用戶登錄
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const result = await getAuthService().login(
      { username, password }, 
      ipAddress, 
      userAgent
    );

    if (result.success && result.user) {
      req.session.user = result.user;
      req.session.isAdmin = false;

      logger.info('User login successful', {
        userId: result.user.id,
        username: result.user.username,
        ip: ipAddress,
        userAgent
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          message: 'Login successful'
        }
      });
    } else {
      logger.warn('User login failed', {
        username,
        ip: ipAddress,
        reason: result.message
      });

      res.status(401).json({
        success: false,
        error: result.message || 'Invalid username or password',
        code: 'LOGIN_FAILED'
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login',
      code: 'LOGIN_ERROR'
    });
  }
});

// 管理員登錄 - 修復參數傳遞順序
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    // 修復：確保類型正確
    const loginCredentials: LoginRequest = { username, password };
    const result = await getAuthService().adminLogin(
      loginCredentials,
      ipAddress, 
      userAgent
    );

    if (result.success) {
      req.session.isAdmin = true;
      req.session.adminUser = { 
        username,
        loginTime: new Date()
      };

      logger.info('Admin login successful', { ip: ipAddress, userAgent });

      res.json({
        success: true,
        data: {
          message: 'Admin login successful',
          isAdmin: true
        }
      });
    } else {
      logger.warn('Admin login failed', {
        username,
        ip: ipAddress,
        reason: result.message
      });

      res.status(401).json({
        success: false,
        error: result.message || 'Invalid admin credentials',
        code: 'ADMIN_LOGIN_FAILED'
      });
    }
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during admin login',
      code: 'ADMIN_LOGIN_ERROR'
    });
  }
});

// 登出
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (req.session.user) {
      // 用戶登出
      await getAuthService().logout(req.session.user.id, ipAddress, userAgent);
      logger.info('User logout successful', {
        userId: req.session.user.id,
        ip: ipAddress
      });
    } else if (req.session.isAdmin) {
      // 管理員登出
      await getAuthService().adminLogout(ipAddress, userAgent);
      logger.info('Admin logout successful', { ip: ipAddress });
    }

    // 清除 session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        return res.status(500).json({
          success: false,
          error: 'Logout failed',
          code: 'LOGOUT_ERROR'
        });
      }

      res.clearCookie('dynamic_form_session');
      res.json({
        success: true,
        data: {
          message: 'Logout successful'
        }
      });
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

// 認證狀態檢查
router.get('/status', (req: Request, res: Response) => {
  const authenticated = !!(req.session?.user || req.session?.isAdmin);
  const isAdmin = !!req.session?.isAdmin;
  const user = req.session?.user || null;

  res.json({
    success: true,
    data: {
      authenticated,
      isAdmin,
      user
    }
  });
});

// ===== 開發測試端點 =====

if (process.env.NODE_ENV === 'development') {
  // 基礎測試
  router.get('/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Auth routes working',
      timestamp: new Date().toISOString(),
      session: {
        hasSession: !!req.session,
        isAuthenticated: !!(req.session?.user || req.session?.isAdmin),
        isAdmin: !!req.session?.isAdmin,
        user: req.session?.user || null,
        adminUser: req.session?.adminUser || null
      },
      environment: process.env.NODE_ENV
    });
  });

  // 測試認證中間件
  router.get('/test/auth', authMiddleware, (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Authentication middleware working',
      user: req.user || null,
      isAdmin: req.isAdmin || false
    });
  });

  // 測試管理員中間件
  router.get('/test/admin', adminMiddleware, (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Admin middleware working',
      adminUser: req.session?.adminUser || null,
      isAdmin: req.isAdmin || false
    });
  });

  logger.info('🧪 Development test endpoints:', {
    endpoints: [
      'GET  http://localhost:3000/api/auth/test',
      'GET  http://localhost:3000/api/auth/test/auth',
      'GET  http://localhost:3000/api/auth/test/admin'
    ]
  });
}

export default router;