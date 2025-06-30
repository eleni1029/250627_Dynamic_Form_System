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
      logger.warn('Projects request without authentication');
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const userId = req.session.user.id;
    logger.info('Getting projects for user:', userId);

    const projects = await getUserService().getUserProjects(userId);

    logger.info('Projects retrieved successfully', {
      userId,
      projectCount: projects.length
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
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

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

export default router;
