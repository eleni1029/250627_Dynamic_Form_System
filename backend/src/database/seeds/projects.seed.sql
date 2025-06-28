// ===== 專案模組初始化 - Part 4 =====
// backend/src/database/seeds/projects.seed.sql

-- 插入專案配置數據
INSERT INTO projects (project_key, project_name, description, is_active) VALUES 
('bmi', 'BMI Calculator', 'Body Mass Index calculator with WHO international standards', true),
('tdee', 'TDEE Calculator', 'Total Daily Energy Expenditure calculator with Mifflin-St Jeor equation', true)
ON CONFLICT (project_key) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 創建測試用戶（如果不存在）
INSERT INTO users (username, password_hash, name, is_active) VALUES 
('testuser', '$2b$12$LQv3c1yqBwEHxPiEQ9Z9gOJmcZrB1lF4j8VzGy3nKgzR7cK2mJ8Vy', 'Test User', true)
ON CONFLICT (username) DO NOTHING;

-- 為測試用戶分配專案權限
DO $$
DECLARE
    test_user_id UUID;
    bmi_project_id UUID;
    tdee_project_id UUID;
BEGIN
    -- 獲取測試用戶 ID
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
    
    -- 獲取專案 ID
    SELECT id INTO bmi_project_id FROM projects WHERE project_key = 'bmi';
    SELECT id INTO tdee_project_id FROM projects WHERE project_key = 'tdee';
    
    -- 分配權限（如果用戶和專案都存在）
    IF test_user_id IS NOT NULL AND bmi_project_id IS NOT NULL THEN
        INSERT INTO user_project_permissions (user_id, project_id) 
        VALUES (test_user_id, bmi_project_id)
        ON CONFLICT (user_id, project_id) DO NOTHING;
    END IF;
    
    IF test_user_id IS NOT NULL AND tdee_project_id IS NOT NULL THEN
        INSERT INTO user_project_permissions (user_id, project_id) 
        VALUES (test_user_id, tdee_project_id)
        ON CONFLICT (user_id, project_id) DO NOTHING;
    END IF;
END $$;

-- ===== 專案模組初始化腳本 =====
// backend/src/scripts/init-projects.ts

import { Pool } from 'pg';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class ProjectInitializer {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // 初始化專案資料庫數據
  async initializeProjects(): Promise<void> {
    try {
      logger.info('🚀 Initializing project modules...');

      // 執行專案種子數據
      const seedPath = path.join(__dirname, '../database/seeds/projects.seed.sql');
      
      if (fs.existsSync(seedPath)) {
        const seedSQL = fs.readFileSync(seedPath, 'utf8');
        await this.pool.query(seedSQL);
        logger.info('✅ Project seed data executed successfully');
      } else {
        logger.warn('⚠️ Project seed file not found, skipping seed data');
      }

      // 驗證專案數據
      await this.verifyProjectsData();

      logger.info('✅ Project modules initialized successfully');

    } catch (error) {
      logger.error('❌ Project initialization failed:', error);
      throw error;
    }
  }

  // 驗證專案數據是否正確初始化
  private async verifyProjectsData(): Promise<void> {
    try {
      // 檢查專案是否存在
      const projectsResult = await this.pool.query(
        'SELECT project_key, project_name, is_active FROM projects WHERE is_active = true'
      );

      if (projectsResult.rows.length === 0) {
        throw new Error('No active projects found in database');
      }

      logger.info(`📊 Found ${projectsResult.rows.length} active projects:`);
      projectsResult.rows.forEach(project => {
        logger.info(`  - ${project.project_key}: ${project.project_name}`);
      });

      // 檢查測試用戶權限
      const permissionsResult = await this.pool.query(`
        SELECT u.username, p.project_key 
        FROM users u
        JOIN user_project_permissions upp ON u.id = upp.user_id
        JOIN projects p ON upp.project_id = p.id
        WHERE u.username = 'testuser'
      `);

      if (permissionsResult.rows.length > 0) {
        logger.info(`👤 Test user permissions:`);
        permissionsResult.rows.forEach(perm => {
          logger.info(`  - ${perm.username} → ${perm.project_key}`);
        });
      }

    } catch (error) {
      logger.error('Project data verification failed:', error);
      throw error;
    }
  }

  // 清理測試數據
  async cleanupTestData(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up test data...');

      // 刪除測試用戶的計算記錄
      await this.pool.query(`
        DELETE FROM bmi_records 
        WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test%')
      `);

      await this.pool.query(`
        DELETE FROM tdee_records 
        WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'test%')
      `);

      logger.info('✅ Test data cleanup completed');

    } catch (error) {
      logger.error('Test data cleanup failed:', error);
      throw error;
    }
  }
}

// ===== API 測試工具 =====
// backend/src/utils/api-test.ts

import { BMICalculationRequest, TDEECalculationRequest } from '../types/project.types';

// BMI 測試數據
export const BMI_TEST_CASES = [
  {
    name: 'Normal BMI - Adult Male',
    data: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male'
    } as BMICalculationRequest,
    expectedBMI: 22.9
  },
  {
    name: 'Overweight BMI - Adult Female',
    data: {
      height: 160,
      weight: 68,
      age: 28,
      gender: 'female'
    } as BMICalculationRequest,
    expectedBMI: 26.6
  },
  {
    name: 'Underweight BMI',
    data: {
      height: 170,
      weight: 50,
      age: 25,
      gender: 'female'
    } as BMICalculationRequest,
    expectedBMI: 17.3
  }
];

// TDEE 測試數據
export const TDEE_TEST_CASES = [
  {
    name: 'Sedentary Adult Male',
    data: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male',
      activity_level: 'sedentary'
    } as TDEECalculationRequest,
    expectedBMR: 1671,
    expectedTDEE: 2005
  },
  {
    name: 'Active Adult Female',
    data: {
      height: 160,
      weight: 55,
      age: 25,
      gender: 'female',
      activity_level: 'active'
    } as TDEECalculationRequest,
    expectedBMR: 1321,
    expectedTDEE: 2278
  },
  {
    name: 'Very Active Young Male',
    data: {
      height: 180,
      weight: 75,
      age: 22,
      gender: 'male',
      activity_level: 'very_active'
    } as TDEECalculationRequest,
    expectedBMR: 1740,
    expectedTDEE: 3306
  }
];

// 驗證計算結果的工具函數
export const validateBMIResult = (result: any, expected: any): boolean => {
  const tolerance = 0.5; // BMI 容差範圍
  return Math.abs(result.bmi - expected.expectedBMI) <= tolerance;
};

export const validateTDEEResult = (result: any, expected: any): boolean => {
  const bmrTolerance = 50; // BMR 容差範圍
  const tdeeTolerance = 100; // TDEE 容差範圍
  
  return (
    Math.abs(result.bmr - expected.expectedBMR) <= bmrTolerance &&
    Math.abs(result.tdee - expected.expectedTDEE) <= tdeeTolerance
  );
};

// ===== 健康檢查端點 =====
// backend/src/routes/health.routes.ts

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

// ===== 專案模組啟動檢查清單 =====
// backend/src/utils/startup-checklist.ts

export interface StartupCheckResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export const runStartupChecklist = async (): Promise<StartupCheckResult[]> => {
  const results: StartupCheckResult[] = [];
  
  try {
    // 1. 檢查環境變數
    const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'SESSION_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
      results.push({
        step: 'Environment Variables',
        status: 'success',
        message: 'All required environment variables are set'
      });
    } else {
      results.push({
        step: 'Environment Variables',
        status: 'error',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      });
    }

    // 2. 檢查資料庫連接
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      results.push({
        step: 'Database Connection',
        status: 'success',
        message: 'Database connection established'
      });
    } catch (error) {
      results.push({
        step: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${error.message}`
      });
    }

    // 3. 檢查必要資料表
    try {
      const pool = getPool();
      const requiredTables = ['users', 'projects', 'user_project_permissions', 'bmi_records', 'tdee_records'];
      
      for (const table of requiredTables) {
        const result = await pool.query(
          "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1",
          [table]
        );
        
        if (parseInt(result.rows[0].count) === 0) {
          results.push({
            step: `Table: ${table}`,
            status: 'error',
            message: `Required table '${table}' does not exist`
          });
        }
      }

      if (results.filter(r => r.step.startsWith('Table:')).length === 0) {
        results.push({
          step: 'Database Tables',
          status: 'success',
          message: 'All required database tables exist'
        });
      }

    } catch (error) {
      results.push({
        step: 'Database Tables',
        status: 'error',
        message: `Table check failed: ${error.message}`
      });
    }

    // 4. 檢查專案模組配置
    const configuredProjects = Object.keys(PROJECT_CONFIGS);
    if (configuredProjects.length > 0) {
      results.push({
        step: 'Project Modules',
        status: 'success',
        message: `${configuredProjects.length} project modules configured: ${configuredProjects.join(', ')}`
      });
    } else {
      results.push({
        step: 'Project Modules',
        status: 'warning',
        message: 'No project modules configured'
      });
    }

    // 5. 檢查專案資料庫記錄
    try {
      const pool = getPool();
      const activeProjects = await pool.query(
        'SELECT project_key FROM projects WHERE is_active = true'
      );

      if (activeProjects.rows.length > 0) {
        const projectKeys = activeProjects.rows.map(p => p.project_key);
        results.push({
          step: 'Active Projects',
          status: 'success',
          message: `${projectKeys.length} active projects in database: ${projectKeys.join(', ')}`
        });
      } else {
        results.push({
          step: 'Active Projects',
          status: 'warning',
          message: 'No active projects found in database'
        });
      }

    } catch (error) {
      results.push({
        step: 'Active Projects',
        status: 'error',
        message: `Failed to check active projects: ${error.message}`
      });
    }

  } catch (error) {
    results.push({
      step: 'Startup Check',
      status: 'error',
      message: `Startup check failed: ${error.message}`
    });
  }

  return results;
};

// 顯示啟動檢查結果
export const displayStartupResults = (results: StartupCheckResult[]): void => {
  console.log('\n🔍 Startup Checklist Results:');
  console.log('================================');

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });

  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;

  console.log('\n📊 Summary:');
  console.log(`   Success: ${successCount}`);
  console.log(`   Warning: ${warningCount}`);
  console.log(`   Error: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n❌ Application startup may have issues. Please check the errors above.');
  } else if (warningCount > 0) {
    console.log('\n⚠️ Application started with warnings. Some features may not work correctly.');
  } else {
    console.log('\n✅ All startup checks passed successfully!');
  }
  console.log('================================\n');
};

// ===== 主應用程式完整整合配置 =====
// backend/src/app.ts (完整更新版本)

/*
需要在現有的 app.ts 中進行以下更新：

import { registerAllProjectModules } from './config/projects.config';
import { createProjectsRoutes } from './routes/projects.routes';
import { createHealthRoutes } from './routes/health.routes';
import { ProjectInitializer } from './scripts/init-projects';
import { runStartupChecklist, displayStartupResults } from './utils/startup-checklist';

// 在現有中間件之後加入：

// 註冊健康檢查路由
app.use('/api/health', createHealthRoutes());

// 註冊專案模組總路由
app.use('/api/projects', createProjectsRoutes());

// 註冊所有專案模組的具體路由
registerAllProjectModules(app);

// 在應用啟動時加入初始化：

const initializeApplication = async () => {
  try {
    // 執行啟動檢查
    const checkResults = await runStartupChecklist();
    displayStartupResults(checkResults);

    // 如果有嚴重錯誤，停止啟動
    const hasErrors = checkResults.some(result => result.status === 'error');
    if (hasErrors) {
      throw new Error('Application startup checks failed');
    }

    // 初始化專案模組
    const projectInitializer = new ProjectInitializer();
    await projectInitializer.initializeProjects();

    console.log('🚀 Application initialized successfully!');

  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
};

// 在啟動服務器之前調用初始化
initializeApplication().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌟 Server running on port ${PORT}`);
    console.log(`📊 BMI Calculator: http://localhost:${PORT}/api/projects/bmi`);
    console.log(`🔥 TDEE Calculator: http://localhost:${PORT}/api/projects/tdee`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  });
});
*/

// ===== 開發環境測試腳本 =====
// backend/src/scripts/test-calculations.ts

import { BMIService } from '../projects/bmi/services/BMIService';
import { TDEEService } from '../projects/tdee/services/TDEEService';
import { BMI_TEST_CASES, TDEE_TEST_CASES, validateBMIResult, validateTDEEResult } from '../utils/api-test';
import { logger } from '../utils/logger';

export class CalculationTester {
  private bmiService: BMIService;
  private tdeeService: TDEEService;

  constructor() {
    this.bmiService = new BMIService();
    this.tdeeService = new TDEEService();
  }

  // 測試 BMI 計算邏輯
  async testBMICalculations(): Promise<void> {
    console.log('\n🧮 Testing BMI Calculations...');
    
    const testUserId = 'test-user-id'; // 模擬用戶 ID
    
    for (const testCase of BMI_TEST_CASES) {
      try {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`   Input: ${testCase.data.height}cm, ${testCase.data.weight}kg`);
        
        const result = await this.bmiService.calculate(testUserId, testCase.data);
        
        if (result.success && result.data) {
          console.log(`   Result: BMI ${result.data.bmi} (${result.data.category})`);
          console.log(`   Expected: BMI ${testCase.expectedBMI}`);
          
          const isValid = validateBMIResult(result.data, testCase);
          console.log(`   Status: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
          
          if (result.data.recommendations.length > 0) {
            console.log(`   Recommendations: ${result.data.recommendations[0]}`);
          }
        } else {
          console.log(`   Status: ❌ FAIL - ${result.error}`);
        }
        
      } catch (error) {
        console.log(`   Status: ❌ ERROR - ${error.message}`);
      }
    }
  }

  // 測試 TDEE 計算邏輯
  async testTDEECalculations(): Promise<void> {
    console.log('\n🔥 Testing TDEE Calculations...');
    
    const testUserId = 'test-user-id'; // 模擬用戶 ID
    
    for (const testCase of TDEE_TEST_CASES) {
      try {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`   Input: ${testCase.data.height}cm, ${testCase.data.weight}kg, ${testCase.data.age}y, ${testCase.data.gender}, ${testCase.data.activity_level}`);
        
        const result = await this.tdeeService.calculate(testUserId, testCase.data);
        
        if (result.success && result.data) {
          console.log(`   Result: BMR ${result.data.bmr}, TDEE ${result.data.tdee}`);
          console.log(`   Expected: BMR ${testCase.expectedBMR}, TDEE ${testCase.expectedTDEE}`);
          
          const isValid = validateTDEEResult(result.data, testCase);
          console.log(`   Status: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
          
          console.log(`   BMI: ${result.data.bmi} (${result.data.bmi_category})`);
          console.log(`   Activity: ${result.data.activity_description}`);
          console.log(`   Calories: Lose ${result.data.recommendations.weight_loss}, Maintain ${result.data.recommendations.maintenance}, Gain ${result.data.recommendations.weight_gain}`);
          
        } else {
          console.log(`   Status: ❌ FAIL - ${result.error}`);
        }
        
      } catch (error) {
        console.log(`   Status: ❌ ERROR - ${error.message}`);
      }
    }
  }

  // 執行所有測試
  async runAllTests(): Promise<void> {
    try {
      console.log('🚀 Starting Calculation Tests...');
      
      await this.testBMICalculations();
      await this.testTDEECalculations();
      
      console.log('\n✅ All calculation tests completed!');
      
    } catch (error) {
      console.error('\n❌ Calculation tests failed:', error);
      throw error;
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const tester = new CalculationTester();
  tester.runAllTests().catch(console.error);
}
