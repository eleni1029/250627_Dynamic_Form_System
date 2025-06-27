// backend/src/scripts/init-db.ts - 修復 SQL 語法解析
import { connectDatabase, query, closeDatabase } from '../config/database';
import { logger } from '../utils/logger';

const initSQL = `
-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 專案配置表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_key VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用戶專案權限表
CREATE TABLE IF NOT EXISTS user_project_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50) DEFAULT 'admin',
    UNIQUE(user_id, project_id)
);

-- 用戶活動記錄表
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session 表
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

-- BMI 計算記錄表
CREATE TABLE IF NOT EXISTS bmi_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    age INTEGER CHECK (age > 0 AND age < 200),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    bmi DECIMAL(4,2) NOT NULL,
    category VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TDEE 計算記錄表
CREATE TABLE IF NOT EXISTS tdee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    age INTEGER NOT NULL CHECK (age > 0 AND age < 200),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    activity_level VARCHAR(20) NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    bmr DECIMAL(7,2) NOT NULL,
    tdee DECIMAL(7,2) NOT NULL,
    activity_factor DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

// 索引創建語句
const indexSQL = `
-- 建立索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_project_permissions_user_id ON user_project_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_permissions_project_id ON user_project_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_bmi_records_user_id ON bmi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_bmi_records_created_at ON bmi_records(created_at);
CREATE INDEX IF NOT EXISTS idx_tdee_records_user_id ON tdee_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tdee_records_created_at ON tdee_records(created_at);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
`;

// 觸發器函數 - 分開執行避免語法解析問題
const triggerFunctionSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
`;

// 觸發器創建語句
const triggerSQL = `
-- 為 users 表建立更新時間觸發器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`;

// 初始數據
const seedSQL = `
-- 插入預設專案
INSERT INTO projects (project_key, project_name, description) VALUES
('bmi_calculator', 'BMI 計算器', '身體質量指數計算工具'),
('tdee_calculator', 'TDEE 計算器', '每日總能量消耗計算工具')
ON CONFLICT (project_key) DO NOTHING;

-- 創建測試用戶 (密碼都是 'password123')
INSERT INTO users (username, password_hash, name, is_active) VALUES
('testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LSHl6J.3khZhJyEii', '測試用戶', true),
('demo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LSHl6J.3khZhJyEii', '演示用戶', true)
ON CONFLICT (username) DO NOTHING;
`;

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');
    
    await connectDatabase();
    
    // 1. 執行基礎表結構創建
    logger.info('Creating tables...');
    const tableStatements = initSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of tableStatements) {
      if (statement.length > 5) {
        try {
          await query(statement + ';');
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            logger.warn('Table creation warning:', {
              statement: statement.substring(0, 100),
              error: error.message
            });
          }
        }
      }
    }
    
    // 2. 執行索引創建
    logger.info('Creating indexes...');
    const indexStatements = indexSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of indexStatements) {
      if (statement.length > 5) {
        try {
          await query(statement + ';');
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            logger.warn('Index creation warning:', {
              statement: statement.substring(0, 100),
              error: error.message
            });
          }
        }
      }
    }
    
    // 3. 執行觸發器函數創建（整個函數作為一個語句）
    logger.info('Creating trigger function...');
    try {
      await query(triggerFunctionSQL);
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        logger.warn('Trigger function creation warning:', {
          error: error.message
        });
      }
    }
    
    // 4. 執行觸發器創建
    logger.info('Creating triggers...');
    const triggerStatements = triggerSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of triggerStatements) {
      if (statement.length > 5) {
        try {
          await query(statement + ';');
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            logger.warn('Trigger creation warning:', {
              statement: statement.substring(0, 100),
              error: error.message
            });
          }
        }
      }
    }
    
    // 5. 執行初始數據插入
    logger.info('Inserting seed data...');
    const seedStatements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of seedStatements) {
      if (statement.length > 5) {
        try {
          await query(statement + ';');
        } catch (error: any) {
          if (!error.message.includes('duplicate key')) {
            logger.warn('Seed data warning:', {
              statement: statement.substring(0, 100),
              error: error.message
            });
          }
        }
      }
    }
    
    logger.info('Database initialization completed successfully');
    
    // 檢查表是否創建成功
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    logger.info('Created tables:', {
      tables: result.rows.map((row: any) => row.table_name)
    });
    
    // 檢查測試用戶是否創建成功
    const userResult = await query('SELECT username, name, is_active FROM users WHERE username IN ($1, $2)', ['testuser', 'demo']);
    logger.info('Created test users:', {
      users: userResult.rows
    });
    
    // 檢查專案是否創建成功
    const projectResult = await query('SELECT project_key, project_name FROM projects');
    logger.info('Created projects:', {
      projects: projectResult.rows
    });
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// 如果直接執行此文件
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };