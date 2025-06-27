import { connectDatabase, query, closeDatabase } from '../config/database';
import { EncryptionUtil } from '../utils/encryption';
import { logger } from '../utils/logger';

interface SeedUser {
  username: string;
  password: string;
  name: string;
  is_active: boolean;
}

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    await connectDatabase();
    
    // 創建測試用戶
    const testUsers: SeedUser[] = [
      {
        username: 'admin_test',
        password: 'admin123',
        name: '管理測試用戶',
        is_active: true
      },
      {
        username: 'user_test',
        password: 'user123',
        name: '一般測試用戶',
        is_active: true
      },
      {
        username: 'demo_user',
        password: 'demo123',
        name: '演示用戶',
        is_active: true
      }
    ];
    
    for (const userData of testUsers) {
      try {
        // 檢查用戶是否已存在
        const existingUser = await query(
          'SELECT id FROM users WHERE username = $1',
          [userData.username]
        );
        
        if (existingUser.rows.length > 0) {
          logger.info(`User ${userData.username} already exists, skipping...`);
          continue;
        }
        
        // 加密密碼
        const passwordHash = await EncryptionUtil.hashPassword(userData.password);
        
        // 創建用戶
        const userResult = await query(
          `INSERT INTO users (username, password_hash, name, is_active) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [userData.username, passwordHash, userData.name, userData.is_active]
        );
        
        const userId = userResult.rows[0].id;
        
        // 為用戶授予所有專案權限
        await query(
          `INSERT INTO user_project_permissions (user_id, project_id, granted_by)
           SELECT $1, id, 'seed' FROM projects`,
          [userId]
        );
        
        logger.info(`Created user: ${userData.username} with all project permissions`);
        
      } catch (error: any) {
        if (error.code === '23505') {
          logger.info(`User ${userData.username} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // 插入一些測試記錄
    await seedTestRecords();
    
    logger.info('Database seeding completed successfully');
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

async function seedTestRecords() {
  // 獲取第一個測試用戶
  const userResult = await query(
    'SELECT id FROM users WHERE username = $1',
    ['user_test']
  );
  
  if (userResult.rows.length === 0) return;
  
  const userId = userResult.rows[0].id;
  
  // 插入測試 BMI 記錄
  await query(
    `INSERT INTO bmi_records (user_id, height, weight, age, gender)
     VALUES ($1, 175.0, 70.0, 25, 'male')`,
    [userId]
  );
  
  // 插入測試 TDEE 記錄
  await query(
    `INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level)
     VALUES ($1, 175.0, 70.0, 25, 'male', 'moderate')`,
    [userId]
  );
  
  // 插入活動記錄
  await query(
    `INSERT INTO activity_logs (user_id, action_type, action_description)
     VALUES ($1, 'USER_LOGIN', 'Test user login during seeding')`,
    [userId]
  );
  
  logger.info('Test records created successfully');
}

// 如果直接執行此文件則運行種子
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };

// backend/src/config/session.ts - 更新的 Session 配置（支援 PostgreSQL）
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { getPool } from './database';

const PgSession = connectPgSimple(session);

export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    pool: () => getPool(), // 使用函數返回 pool，確保資料庫已連接
    tableName: 'session',
    createTableIfMissing: false, // 我們在初始化時已創建表
  }),
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次請求都重新設置過期時間
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
    httpOnly: true, // 防止 XSS 攻擊
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // 30 天
    sameSite: 'strict', // CSRF 保護
  },
  name: 'dynamic_form_session', // 自定義 session 名稱
};

// Docker Compose 配置（更新版本）
// docker-compose.yml
// 注意：這個文件需要放在項目根目錄，不是 src 目錄