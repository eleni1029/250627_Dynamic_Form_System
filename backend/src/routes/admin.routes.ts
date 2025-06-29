import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middleware/admin.middleware';
import { logger } from '../utils/logger';
import { AdminService } from '../services/admin.service';

const router = Router();
let adminService: AdminService;

function getAdminService(): AdminService {
  if (!adminService) {
    adminService = new AdminService();
  }
  return adminService;
}

function adminWithLogging(action: string) {
  return adminMiddleware;
}

router.use(adminMiddleware);

// 獲取用戶列表
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = req.query.sort as string;
    const order = req.query.order as string;

    const result = await getAdminService().getUserList(page, limit, sort, order);
    res.json(result);
    return;
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      code: 'GET_USERS_ERROR'
    });
    return;
  }
});

// 創建用戶
router.post('/users', adminWithLogging('CREATE_USER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, name, password, avatar_url, is_active } = req.body;

    if (!username || !name || !password) {
      res.status(400).json({
        success: false,
        error: 'Username, name, and password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    const userData = {
      username,
      name,
      password,
      avatar_url,
      is_active: is_active !== undefined ? is_active : true
    };

    const result = await getAdminService().createUser(userData, req.ip);
    res.status(201).json(result);
    return;
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      code: 'CREATE_USER_ERROR'
    });
    return;
  }
});

// 更新用戶
router.put('/users/:userId', adminWithLogging('UPDATE_USER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId!;
    const { name, password, avatar_url, is_active } = req.body;

    if (!name && !password && !avatar_url && is_active === undefined) {
      res.status(400).json({
        success: false,
        error: 'At least one field is required to update',
        code: 'NO_UPDATE_FIELDS'
      });
      return;
    }

    const updateData = { name, password, avatar_url, is_active };
    const updatedUser = await getAdminService().updateUser(userId, updateData, req.ip);
    
    res.json(updatedUser);
    return;
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      code: 'UPDATE_USER_ERROR'
    });
    return;
  }
});

// 刪除用戶
router.delete('/users/:userId', adminWithLogging('DELETE_USER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId!;
    const success = await getAdminService().deleteUser(userId, req.ip);
    
    if (success) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
      return;
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      code: 'DELETE_USER_ERROR'
    });
    return;
  }
});

// 獲取權限列表
router.get('/permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getAdminService().getAllPermissions(page, limit);
    res.json(result);
    return;
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions',
      code: 'GET_PERMISSIONS_ERROR'
    });
    return;
  }
});

// 授予權限
router.post('/permissions/grant', adminWithLogging('GRANT_PERMISSION'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, project_key } = req.body;

    if (!user_id || !project_key) {
      res.status(400).json({
        success: false,
        error: 'User ID and project key are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    const request = {
      userId: user_id,
      projectKey: project_key
    };

    const result = await getAdminService().grantPermission(request, req.ip);
    res.json(result);
    return;
  } catch (error) {
    logger.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant permission',
      code: 'GRANT_PERMISSION_ERROR'
    });
    return;
  }
});

// 撤銷權限
router.delete('/permissions/revoke', adminWithLogging('REVOKE_PERMISSION'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, project_key } = req.body;

    if (!user_id || !project_key) {
      res.status(400).json({
        success: false,
        error: 'User ID and project key are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    const request = {
      userId: user_id,
      projectKey: project_key
    };

    const result = await getAdminService().revokePermission(request, req.ip);
    res.json(result);
    return;
  } catch (error) {
    logger.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke permission',
      code: 'REVOKE_PERMISSION_ERROR'
    });
    return;
  }
});

// 獲取活動日誌
router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const actionType = req.query.actionType as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await getAdminService().getActivityLogs(page, limit, userId, actionType, startDate, endDate);
    res.json(result);
    return;
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity logs',
      code: 'GET_LOGS_ERROR'
    });
    return;
  }
});

// 清理舊日誌
router.post('/logs/clean', async (req: Request, res: Response): Promise<void> => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 30;
    const deletedCount = await getAdminService().cleanOldLogs(daysToKeep);
    
    res.json({
      success: true,
      message: `Cleaned ${deletedCount} old log records`,
      deletedCount
    });
    return;
  } catch (error) {
    logger.error('Clean logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean logs',
      code: 'CLEAN_LOGS_ERROR'
    });
    return;
  }
});

export default router;
