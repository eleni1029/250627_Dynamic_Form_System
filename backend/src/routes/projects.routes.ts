// backend/src/routes/projects.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserAccessibleProjects, validateProjectAccess, PROJECT_CONFIGS } from '../config/projects.config';

export const createProjectsRoutes = (): Router => {
  const router = Router();

  // 所有專案相關路由都需要認證
  router.use(authMiddleware);

  // GET /api/projects - 獲取用戶可訪問的專案列表
  router.get('/', (req, res) => {
    try {
      const userPermissions = ['bmi_access', 'tdee_access']; // 簡化版權限
      const accessibleProjects = getUserAccessibleProjects(userPermissions);

      res.json({
        success: true,
        data: accessibleProjects,
        message: `Found ${accessibleProjects.length} accessible projects`
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get accessible projects',
        code: 'GET_PROJECTS_ERROR'
      });
    }
  });

  // GET /api/projects/:projectKey - 獲取特定專案資訊
  router.get('/:projectKey', (req, res) => {
    try {
      const { projectKey } = req.params;
      const userPermissions = ['bmi_access', 'tdee_access']; // 簡化版權限

      if (!validateProjectAccess(projectKey, userPermissions)) {
        res.status(403).json({
          success: false,
          error: 'Project access denied or project not found',
          code: 'PROJECT_ACCESS_DENIED'
        });
        return;
      }

      const project = PROJECT_CONFIGS[projectKey as keyof typeof PROJECT_CONFIGS];
      
      res.json({
        success: true,
        data: {
          key: project.key,
          name: project.name,
          name_zh: project.name_zh,
          description: project.description,
          description_zh: project.description_zh,
          icon: project.icon,
          route: project.route,
          features: project.features || []
        },
        message: 'Project information retrieved successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get project information',
        code: 'GET_PROJECT_INFO_ERROR'
      });
    }
  });

  return router;
};