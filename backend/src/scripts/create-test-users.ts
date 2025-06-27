// backend/src/scripts/create-test-users.ts - 創建測試用戶
import { connectDatabase, query, closeDatabase } from '../config/database';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';

interface TestUser {
  username: string;
  password: string;
  name: string;
  is_active: boolean;
}

const testUsers: TestUser[] = [
  {
    username: 'testuser',
    password: 'password123',
    name: '測試用戶',
    is_active: true
  },
  {
    username: 'demo',
    password: 'password123',
    name: '演示用戶',
    is_active: true
  },
  {
    username: 'john',
    password: 'password123',
    name: 'John Doe',
    is_active: true
  }
];

async function createTestUsers() {
  try {
    logger.info('開始創建測試用戶...');
    
    await connectDatabase();
    
    for (const userData of testUsers) {
      try {
        // 檢查用戶是否已存在
        const existingUser = await query(
          'SELECT id, username FROM users WHERE username = $1',
          [userData.username]
        );
        
        if (existingUser.rows.length > 0) {
          logger.info(`用戶 ${userData.username} 已存在，跳過創建`);
          continue;
        }
        
        // 加密密碼
        logger.info(`正在加密 ${userData.username} 的密碼...`);
        const passwordHash = await EncryptionUtil.hashPassword(userData.password);
        
        // 創建用戶
        logger.info(`正在創建用戶 ${userData.username}...`);
        const userResult = await query(
          `INSERT INTO users (username, password_hash, name, is_active) 
           VALUES ($1, $2, $3, $4) RETURNING id, username`,
          [userData.username, passwordHash, userData.name, userData.is_active]
        );
        
        const newUser = userResult.rows[0];
        logger.info(`✅ 成功創建用戶: ${newUser.username} (ID: ${newUser.id})`);
        
        // 為用戶授予所有專案權限
        const projectsResult = await query('SELECT id, project_key FROM projects');
        
        for (const project of projectsResult.rows) {
          try {
            await query(
              `INSERT INTO user_project_permissions (user_id, project_id, granted_by)
               VALUES ($1, $2, 'system')`,
              [newUser.id, project.id]
            );
            
            logger.info(`   ✅ 授予 ${project.project_key} 權限`);
          } catch (permError: any) {
            if (permError.code !== '23505') { // 忽略重複鍵錯誤
              logger.warn(`   ⚠️  授予權限失敗: ${permError.message}`);
            }
          }
        }
        
      } catch (error: any) {
        if (error.code === '23505') {
          logger.info(`用戶 ${userData.username} 已存在`);
        } else {
          logger.error(`創建用戶 ${userData.username} 失敗:`, error);
        }
      }
    }
    
    // 驗證創建結果
    const allUsers = await query('SELECT username, name, is_active, created_at FROM users ORDER BY created_at');
    logger.info('現有用戶列表:', {
      users: allUsers.rows
    });
    
    // 檢查權限
    const permissions = await query(`
      SELECT u.username, p.project_key 
      FROM user_project_permissions upp
      JOIN users u ON upp.user_id = u.id
      JOIN projects p ON upp.project_id = p.id
      ORDER BY u.username, p.project_key
    `);
    
    logger.info('用戶權限列表:', {
      permissions: permissions.rows
    });
    
    logger.info('✅ 測試用戶創建完成');
    
  } catch (error) {
    logger.error('❌ 創建測試用戶失敗:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// 如果直接執行此文件
if (require.main === module) {
  createTestUsers();
}

export { createTestUsers };