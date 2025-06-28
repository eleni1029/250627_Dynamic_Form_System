// ===== backend/src/config/projects.config.ts =====
import { BMI_PROJECT_CONFIG, registerBMIModule } from '../projects/bmi';
import { TDEE_PROJECT_CONFIG, registerTDEEModule } from '../projects/tdee';

// 所有專案模組配置
export const PROJECT_CONFIGS = {
  bmi: BMI_PROJECT_CONFIG,
  tdee: TDEE_PROJECT_CONFIG
} as const;

// 專案模組註冊函數
export const registerAllProjectModules = (app: any): void => {
  console.log('🚀 Registering project modules...');
  
  try {
    // 註冊 BMI 模組
    registerBMIModule(app);
    
    // 註冊 TDEE 模組
    registerTDEEModule(app);
    
    console.log('✅ All project modules registered successfully');
    console.log('📊 Available projects:', Object.keys(PROJECT_CONFIGS));
    
  } catch (error) {
    console.error('❌ Error registering project modules:', error);
    throw error;
  }
};

// 獲取用戶可訪問的專案列表
export const getUserAccessibleProjects = (userPermissions: string[]) => {
  const accessibleProjects = [];
  
  for (const [key, config] of Object.entries(PROJECT_CONFIGS)) {
    // 檢查用戶是否有訪問該專案的權限
    const hasPermission = config.permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (hasPermission && config.isActive) {
      accessibleProjects.push({
        key: config.key,
        name: config.name,
        name_zh: config.name_zh,
        description: config.description,
        description_zh: config.description_zh,
        icon: config.icon,
        route: config.route
      });
    }
  }
  
  return accessibleProjects;
};

// 驗證專案是否存在且用戶有權限訪問
export const validateProjectAccess = (projectKey: string, userPermissions: string[]): boolean => {
  const project = PROJECT_CONFIGS[projectKey as keyof typeof PROJECT_CONFIGS];
  
  if (!project || !project.isActive) {
    return false;
  }
  
  return project.permissions.some(permission => 
    userPermissions.includes(permission)
  );
};

// ===== backend/src/routes/projects.routes.ts =====
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
      const userPermissions = req.session.user?.permissions || [];
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
      const userPermissions = req.session.user?.permissions || [];

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

// ===== backend/src/routes/health.routes.ts =====
import { Router } from 'express';
import { getPool } from '../config/database';
import { PROJECT_CONFIGS } from '../config/projects.config';
import { logger } from '../utils/logger';

export const createHealthRoutes = (): Router => {
  const router = Router();

  // GET /api/health - 系統健康檢查
  router.get('/', async (req, res) => {
    try {
      const pool = getPool();
      
      // 檢查資料庫連接
      const dbResult = await pool.query('SELECT NOW() as current_time');
      
      // 檢查專案模組狀態
      const projectsResult = await pool.query(
        'SELECT COUNT(*) as count FROM projects WHERE is_active = true'
      );

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          currentTime: dbResult.rows[0].current_time
        },
        projects: {
          registered: Object.keys(PROJECT_CONFIGS).length,
          active: parseInt(projectsResult.rows[0].count)
        },
        modules: {
          bmi: PROJECT_CONFIGS.bmi.isActive,
          tdee: PROJECT_CONFIGS.tdee.isActive
        }
      };

      res.status(200).json({
        success: true,
        data: healthStatus
      });

    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable'
      });
    }
  });

  // GET /api/health/projects - 專案模組健康檢查
  router.get('/projects', async (req, res) => {
    try {
      const pool = getPool();
      
      // 檢查各專案表是否存在且有結構
      const tableChecks = await Promise.all([
        pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'bmi_records'"),
        pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tdee_records'"),
        pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'projects'")
      ]);

      const projectHealth = {
        bmi: {
          table_exists: parseInt(tableChecks[0].rows[0].count) > 0,
          config_loaded: !!PROJECT_CONFIGS.bmi,
          is_active: PROJECT_CONFIGS.bmi.isActive
        },
        tdee: {
          table_exists: parseInt(tableChecks[1].rows[0].count) > 0,
          config_loaded: !!PROJECT_CONFIGS.tdee,
          is_active: PROJECT_CONFIGS.tdee.isActive
        },
        projects_table: {
          exists: parseInt(tableChecks[2].rows[0].count) > 0
        }
      };

      res.status(200).json({
        success: true,
        data: projectHealth
      });

    } catch (error) {
      logger.error('Project health check failed:', error);
      
      res.status(503).json({
        success: false,
        error: 'Project health check failed'
      });
    }
  });

  return router;
};