import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

const router = Router();
let userService: UserService;

function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}

// 獲取用戶可訪問的專案
router.get('/projects', async (req: Request, res: Response): Promise<void> => {
  try {
    // 檢查 session 中是否有用戶信息
    if (!req.session?.user) {
      logger.warn('Projects request without authentication', {
        sessionExists: !!req.session,
        hasUser: false,
        path: req.path
      });
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const userId = req.session.user.id;
    logger.info('Getting projects for user:', {
      userId,
      username: req.session.user.username
    });

    const projects = await getUserService().getUserProjects(userId);

    logger.info('Projects retrieved successfully', {
      userId,
      projectCount: projects.length,
      projects: projects.map(p => ({ key: p.project.key, name: p.project.name }))
    });

    res.json({
      success: true,
      data: projects,
      message: 'Projects retrieved successfully'
    });
  } catch (error) {
    logger.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user projects',
      code: 'GET_PROJECTS_ERROR'
    });
  }
});

// 獲取用戶資料
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session?.user) {
      logger.warn('Profile request without authentication', {
        sessionExists: !!req.session,
        hasUser: false,
        path: req.path
      });
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    logger.info('Profile requested for user:', {
      userId: req.session.user.id,
      username: req.session.user.username
    });

    res.json({
      success: true,
      data: req.session.user,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// 檢查用戶是否有特定專案權限
router.get('/permissions/:projectKey', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session?.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const { projectKey } = req.params;
    const userId = req.session.user.id;

    const hasPermission = await getUserService().hasProjectPermission(userId, projectKey);

    res.json({
      success: true,
      data: {
        hasPermission,
        projectKey,
        userId
      },
      message: 'Permission checked successfully'
    });
  } catch (error) {
    logger.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission',
      code: 'PERMISSION_CHECK_ERROR'
    });
  }
});

export default router;
