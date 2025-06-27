// backend/src/routes/admin.routes.ts - 修復資料庫初始化順序
import { Router, Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { logger } from '../utils/logger';
import { adminMiddleware, adminWithLogging } from '../middleware/admin.middleware';

const router = Router();

// 延遲初始化服務
let adminService: AdminService;

function getAdminService(): AdminService {
  if (!adminService) {
    adminService = new AdminService();
  }
  return adminService;
}

// 所有管理員路由都需要管理員權限
router.use(adminMiddleware);

// ===== 用戶管理 =====

// 獲取用戶列表
router.get('/users', adminWithLogging('GET_USER_LIST'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = req.query.sort as string || 'created_at';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';

    const result = await getAdminService().getUserList(page, limit, sort, order);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get user list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user list',
      code: 'GET_USER_LIST_ERROR'
    });
  }
});

// 創建新用戶
router.post('/users', adminWithLogging('CREATE_USER'), async (req: Request, res: Response) => {
  try {
    const { username, password, name, is_active } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and name are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const newUser = await getAdminService().createUser({
      username,
      password,
      name,
      is_active: is_active !== undefined ? is_active : true
    }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        message: 'User created successfully'
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    
    if (error instanceof Error && error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
        code: 'USERNAME_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      code: 'CREATE_USER_ERROR'
    });
  }
});

// 更新用戶
router.put('/users/:userId', adminWithLogging('UPDATE_USER'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, password, is_active } = req.body;

    if (!name && !password && is_active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field is required',
        code: 'MISSING_UPDATE_FIELDS'
      });
    }

    const updateData: { name?: string; password?: string; is_active?: boolean } = {};
    if (name) updateData.name = name;
    if (password) updateData.password = password;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedUser = await getAdminService().updateUser(userId, updateData, req.ip);

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'User updated successfully'
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// 刪除用戶
router.delete('/users/:userId', adminWithLogging('DELETE_USER'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const success = await getAdminService().deleteUser(userId, req.ip);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      code: 'DELETE_USER_ERROR'
    });
  }
});

// ===== 權限管理 =====

// 獲取所有權限設定
router.get('/permissions', adminWithLogging('GET_PERMISSIONS'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getAdminService().getAllPermissions(page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions',
      code: 'GET_PERMISSIONS_ERROR'
    });
  }
});

// 授予權限
router.post('/permissions/grant', adminWithLogging('GRANT_PERMISSION'), async (req: Request, res: Response) => {
  try {
    const { user_id, project_id } = req.body;

    if (!user_id || !project_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Project ID are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const success = await getAdminService().grantPermission({
      user_id,
      project_id
    }, req.ip);

    if (!success) {
      return res.status(409).json({
        success: false,
        error: 'Permission already exists or failed to grant',
        code: 'PERMISSION_EXISTS'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Permission granted successfully'
      }
    });
  } catch (error) {
    logger.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant permission',
      code: 'GRANT_PERMISSION_ERROR'
    });
  }
});

// 撤銷權限
router.delete('/permissions/revoke', adminWithLogging('REVOKE_PERMISSION'), async (req: Request, res: Response) => {
  try {
    const { user_id, project_id } = req.body;

    if (!user_id || !project_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Project ID are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const success = await getAdminService().revokePermission({
      user_id,
      project_id
    }, req.ip);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Permission revoked successfully'
      }
    });
  } catch (error) {
    logger.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke permission',
      code: 'REVOKE_PERMISSION_ERROR'
    });
  }
});

// ===== 活動記錄 =====

// 獲取活動記錄
router.get('/logs', adminWithLogging('GET_ACTIVITY_LOGS'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const actionType = req.query.actionType as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await getAdminService().getActivityLogs(page, limit, userId, actionType, startDate, endDate);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity logs',
      code: 'GET_LOGS_ERROR'
    });
  }
});

// 清理舊記錄
router.delete('/logs/clean', adminWithLogging('CLEAN_OLD_LOGS'), async (req: Request, res: Response) => {
  try {
    const daysToKeep = parseInt(req.query.days as string) || 90;

    const deletedCount = await getAdminService().cleanOldLogs(daysToKeep);

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Cleaned ${deletedCount} old activity logs`
      }
    });
  } catch (error) {
    logger.error('Clean old logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean old logs',
      code: 'CLEAN_LOGS_ERROR'
    });
  }
});

// 開發測試端點
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Admin routes working',
      timestamp: new Date().toISOString(),
      isAdmin: req.isAdmin
    });
  });
}

export default router;