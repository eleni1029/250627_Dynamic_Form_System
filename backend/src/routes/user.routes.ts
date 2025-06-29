import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 創建別名以避免混淆
const userAuthMiddleware = authMiddleware;
const activeUserMiddleware = authMiddleware;

let userService: UserService;

function getUserService(): UserService {
  if (!userService) {
    userService = new UserService();
  }
  return userService;
}

router.use(authMiddleware);

// 獲取用戶資料
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not found in session',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    const userWithPermissions = await getUserService().getUserWithPermissions(req.user.id);
    
    if (!userWithPermissions) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userWithPermissions.id,
          username: userWithPermissions.username,
          name: userWithPermissions.name,
          avatar_url: userWithPermissions.avatar_url,
          is_active: userWithPermissions.is_active,
          created_at: userWithPermissions.created_at,
          permissions: userWithPermissions.permissions,
          projects: userWithPermissions.projects
        }
      }
    });
    return;
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'PROFILE_ERROR'
    });
    return;
  }
});

// 更新用戶資料
router.put('/profile', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const { name, password } = req.body;
    
    if (!name && !password) {
      res.status(400).json({
        success: false,
        error: 'At least one field (name or password) is required',
        code: 'MISSING_FIELDS'
      });
      return;
    }

    const updateData: { name?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (password) updateData.password = password;

    const updatedUser = await getUserService().updateUser(req.user.id, updateData);

    if (updatedUser && req.session.user) {
      if (name) req.session.user.name = updatedUser.name || name;
    }

    logger.info('User profile updated', {
      userId: req.user.id,
      username: req.user.username,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
    return;
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
    return;
  }
});

// 上傳頭像
router.post('/avatar', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // 這裡應該有檔案上傳邏輯，現在先簡化
    const avatar_url = '/uploads/default-avatar.png';
    
    const updatedUser = await getUserService().updateAvatar(req.user.id, avatar_url);

    if (updatedUser && req.session.user) {
      req.session.user.avatar_url = updatedUser.avatar_url || avatar_url;
    }

    logger.info('User avatar updated', {
      userId: req.user.id,
      username: req.user.username,
      avatarUrl: avatar_url
    });

    res.json({
      success: true,
      data: { 
        user: updatedUser,
        avatar_url: avatar_url
      },
      message: 'Avatar uploaded successfully'
    });
    return;
  } catch (error) {
    logger.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
      code: 'UPLOAD_AVATAR_ERROR'
    });
    return;
  }
});

// 獲取用戶可訪問的專案
router.get('/projects', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const projects = await getUserService().getUserProjects(req.user.id);

    logger.debug('User projects retrieved', {
      userId: req.user.id,
      projectCount: projects.length
    });

    res.json({
      success: true,
      data: { projects },
      message: 'Projects retrieved successfully'
    });
    return;
  } catch (error) {
    logger.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user projects',
      code: 'GET_PROJECTS_ERROR'
    });
    return;
  }
});

// 檢查用戶對特定專案的權限
router.get('/projects/:projectKey/permission', userAuthMiddleware, activeUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const projectKey = req.params.projectKey!;
    
    if (!projectKey) {
      res.status(400).json({
        success: false,
        error: 'Project key is required',
        code: 'MISSING_PROJECT_KEY'
      });
      return;
    }

    const hasPermission = await getUserService().hasProjectPermission(req.user.id, projectKey);

    logger.debug('Project permission checked', {
      userId: req.user.id,
      projectKey: projectKey,
      hasPermission: hasPermission
    });

    res.json({
      success: true,
      data: {
        projectKey: projectKey,
        hasPermission: hasPermission
      },
      message: 'Permission check completed'
    });
    return;
  } catch (error) {
    logger.error('Check project permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check project permission',
      code: 'PERMISSION_CHECK_ERROR'
    });
    return;
  }
});

export default router;
