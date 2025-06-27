// backend/src/scripts/init-db.ts - 資料庫初始化腳本
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
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TDEE 計算記錄表
CREATE TABLE IF NOT EXISTS tdee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    activity_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- 建立更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 users 表建立更新時間觸發器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入預設專案
INSERT INTO projects (project_key, project_name, description) VALUES
('bmi_calculator', 'BMI 計算器', '身體質量指數計算工具'),
('tdee_calculator', 'TDEE 計算器', '每日總能量消耗計算工具')
ON CONFLICT (project_key) DO NOTHING;
`;

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');
    
    await connectDatabase();
    
    // 分割 SQL 語句並執行
    const statements = initSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await query(statement + ';');
        } catch (error: any) {
          // 忽略某些預期的錯誤（如表已存在）
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist')) {
            logger.warn('SQL statement warning:', {
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