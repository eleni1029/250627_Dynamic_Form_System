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

      // 修復：使用前端期望的格式
      res.json({
        success: true,
        data: {
          user: result.user
        },
        message: result.message
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

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.session.user) {
      await getAuthService().logout(req.session.user.id);
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

router.get('/profile', (req: Request, res: Response): void => {
  if (req.session?.user) {
    res.json({
      success: true,
      data: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }
});

export default router;
