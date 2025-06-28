// ===== 檔案 12: backend/src/scripts/init-projects.ts =====

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
        WHERE u.username IN ('testuser', 'demo')
      `);

      if (permissionsResult.rows.length > 0) {
        logger.info(`👤 User permissions:`);
        permissionsResult.rows.forEach(perm => {
          logger.info(`  - ${perm.username} → ${perm.project_key}`);
        });
      }

      // 檢查資料表結構
      await this.checkTableStructure();

    } catch (error) {
      logger.error('Project data verification failed:', error);
      throw error;
    }
  }

  // 檢查資料表結構
  private async checkTableStructure(): Promise<void> {
    try {
      const requiredTables = ['users', 'projects', 'user_project_permissions', 'bmi_records', 'tdee_records', 'activity_logs'];
      const missingTables: string[] = [];

      for (const table of requiredTables) {
        const result = await this.pool.query(
          "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1",
          [table]
        );
        
        if (parseInt(result.rows[0].count) === 0) {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }

      logger.info('✅ All required database tables exist');

    } catch (error) {
      logger.error('Table structure check failed:', error);
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

      // 清理舊的活動記錄（保留最近30天）
      await this.pool.query(`
        DELETE FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);

      logger.info('✅ Test data cleanup completed');

    } catch (error) {
      logger.error('Test data cleanup failed:', error);
      throw error;
    }
  }

  // 重置專案模組
  async resetProjects(): Promise<void> {
    try {
      logger.info('🔄 Resetting project modules...');

      // 清空所有計算記錄
      await this.pool.query('DELETE FROM bmi_records');
      await this.pool.query('DELETE FROM tdee_records');
      
      // 清空用戶權限（保留管理員）
      await this.pool.query(`
        DELETE FROM user_project_permissions 
        WHERE user_id NOT IN (SELECT id FROM users WHERE username = 'admin')
      `);

      // 刪除測試用戶
      await this.pool.query("DELETE FROM users WHERE username LIKE 'test%' OR username = 'demo'");

      // 重新初始化
      await this.initializeProjects();

      logger.info('✅ Project modules reset completed');

    } catch (error) {
      logger.error('Project reset failed:', error);
      throw error;
    }
  }

  // 生成測試數據
  async generateTestData(): Promise<void> {
    try {
      logger.info('📊 Generating additional test data...');

      const testUserId = await this.pool.query("SELECT id FROM users WHERE username = 'testuser'");
      
      if (testUserId.rows.length === 0) {
        logger.warn('Test user not found, skipping test data generation');
        return;
      }

      const userId = testUserId.rows[0].id;

      // 生成更多 BMI 記錄
      const bmiTestData = [
        { height: 170, weight: 65, age: 25, gender: 'female' },
        { height: 180, weight: 75, age: 35, gender: 'male' },
        { height: 165, weight: 55, age: 28, gender: 'female' },
        { height: 175, weight: 80, age: 40, gender: 'male' }
      ];

      for (const data of bmiTestData) {
        await this.pool.query(`
          INSERT INTO bmi_records (user_id, height, weight, age, gender, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
        `, [userId, data.height, data.weight, data.age, data.gender]);
      }

      // 生成更多 TDEE 記錄
      const tdeeTestData = [
        { height: 170, weight: 65, age: 25, gender: 'female', activity_level: 'light' },
        { height: 180, weight: 75, age: 35, gender: 'male', activity_level: 'active' },
        { height: 165, weight: 55, age: 28, gender: 'female', activity_level: 'moderate' },
        { height: 175, weight: 80, age: 40, gender: 'male', activity_level: 'sedentary' }
      ];

      for (const data of tdeeTestData) {
        await this.pool.query(`
          INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
        `, [userId, data.height, data.weight, data.age, data.gender, data.activity_level]);
      }

      logger.info('✅ Test data generation completed');

    } catch (error) {
      logger.error('Test data generation failed:', error);
      throw error;
    }
  }

  // 獲取專案統計資訊
  async getProjectStats(): Promise<any> {
    try {
      const stats = await Promise.all([
        this.pool.query('SELECT COUNT(*) as count FROM projects WHERE is_active = true'),
        this.pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
        this.pool.query('SELECT COUNT(*) as count FROM user_project_permissions'),
        this.pool.query('SELECT COUNT(*) as count FROM bmi_records'),
        this.pool.query('SELECT COUNT(*) as count FROM tdee_records'),
        this.pool.query('SELECT COUNT(*) as count FROM activity_logs WHERE created_at > NOW() - INTERVAL \'7 days\'')
      ]);

      return {
        active_projects: parseInt(stats[0].rows[0].count),
        active_users: parseInt(stats[1].rows[0].count),
        total_permissions: parseInt(stats[2].rows[0].count),
        bmi_records: parseInt(stats[3].rows[0].count),
        tdee_records: parseInt(stats[4].rows[0].count),
        recent_activities: parseInt(stats[5].rows[0].count)
      };

    } catch (error) {
      logger.error('Failed to get project stats:', error);
      throw error;
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const initializer = new ProjectInitializer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      initializer.initializeProjects().catch(console.error);
      break;
    case 'clean':
      initializer.cleanupTestData().catch(console.error);
      break;
    case 'reset':
      initializer.resetProjects().catch(console.error);
      break;
    case 'generate':
      initializer.generateTestData().catch(console.error);
      break;
    case 'stats':
      initializer.getProjectStats().then(stats => {
        console.log('📊 Project Statistics:');
        console.log(JSON.stringify(stats, null, 2));
      }).catch(console.error);
      break;
    default:
      console.log('Usage: npm run init:projects [init|clean|reset|generate|stats]');
      break;
  }
}