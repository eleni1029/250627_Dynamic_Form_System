// backend/src/routes/user.routes.ts - 修復 TypeScript 類型錯誤
import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { authMiddleware, userAuthMiddleware, activeUserMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 延遲初始化服務
let userService: UserService;

function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}

// 所有用戶路由都需要認證
router.use(authMiddleware);

// 獲取用戶資料
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found in session',
        code: 'USER_NOT_FOUND'
      });
    }

    const userWithPermissions = await getUserService().getUserWithPermissions(req.user.id);
    
    if (!userWithPermissions) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: userWithPermissions
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'PROFILE_ERROR'
    });
  }
});

// 更新用戶資料
router.put('/profile', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response) => {
  try {
    // 確保 req.user 存在
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const { name, password } = req.body;
    
    if (!name && !password) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name or password) is required',
        code: 'MISSING_FIELDS'
      });
    }

    const updateData: { name?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (password) updateData.password = password;

    const updatedUser = await getUserService().updateUser(req.user.id, updateData);

    // 更新 session 中的用戶信息
    if (updatedUser && req.session.user) {
      req.session.user.name = updatedUser.name;
    }

    logger.info('User profile updated', {
      userId: req.user.id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Profile updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// 上傳用戶頭像
router.post('/avatar', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response) => {
  try {
    // 確保 req.user 存在
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    // 這裡應該集成文件上傳中間件（如 multer）
    // 目前簡化處理，假設前端傳送 avatar_url
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required',
        code: 'MISSING_AVATAR_URL'
      });
    }

    const updatedUser = await getUserService().updateAvatar(req.user.id, avatar_url);

    // 更新 session 中的用戶信息
    if (updatedUser && req.session.user) {
      req.session.user.avatar_url = updatedUser.avatar_url;
    }

    logger.info('User avatar updated', {
      userId: req.user.id,
      avatarUrl: avatar_url
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Avatar updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update user avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update avatar',
      code: 'UPDATE_AVATAR_ERROR'
    });
  }
});

// 獲取用戶可訪問的專案列表
router.get('/projects', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response) => {
  try {
    // 確保 req.user 存在
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const projects = await getUserService().getUserProjects(req.user.id);

    res.json({
      success: true,
      data: {
        projects
      }
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

// 檢查用戶對特定專案的權限
router.get('/projects/:projectKey/permission', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response) => {
  try {
    // 確保 req.user 存在
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const { projectKey } = req.params;
    
    const hasPermission = await getUserService().hasProjectPermission(req.user.id, projectKey);

    res.json({
      success: true,
      data: {
        projectKey,
        hasPermission
      }
    });
  } catch (error) {
    logger.error('Check project permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check project permission',
      code: 'CHECK_PERMISSION_ERROR'
    });
  }
});

// 開發測試端點
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'User routes working',
      timestamp: new Date().toISOString(),
      user: req.user,
      isAdmin: req.isAdmin
    });
  });
}

export default router;