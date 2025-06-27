-- backend/database/init.sql
-- Dynamic Form System Database Schema

-- 用戶表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 專案配置表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_key VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用戶專案權限表
CREATE TABLE user_project_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50) DEFAULT 'admin',
    UNIQUE(user_id, project_id)
);

-- 用戶活動記錄表
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session 表 (express-session 使用)
CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IDX_session_expire ON session(expire);

-- BMI 計算記錄表
CREATE TABLE bmi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2) NOT NULL, -- 身高 (cm)
    weight DECIMAL(5,2) NOT NULL, -- 體重 (kg)
    age INTEGER, -- 年齡
    gender VARCHAR(10), -- 性別 ('male', 'female', 'other')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TDEE 計算記錄表
CREATE TABLE tdee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height DECIMAL(5,2) NOT NULL, -- 身高 (cm)
    weight DECIMAL(5,2) NOT NULL, -- 體重 (kg)
    age INTEGER NOT NULL, -- 年齡
    gender VARCHAR(10) NOT NULL, -- 性別 ('male', 'female')
    activity_level VARCHAR(20) NOT NULL, -- 活動等級 ('sedentary', 'light', 'moderate', 'active', 'very_active')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_user_project_permissions_user_id ON user_project_permissions(user_id);
CREATE INDEX idx_user_project_permissions_project_id ON user_project_permissions(project_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_bmi_records_user_id ON bmi_records(user_id);
CREATE INDEX idx_bmi_records_created_at ON bmi_records(created_at);
CREATE INDEX idx_tdee_records_user_id ON tdee_records(user_id);
CREATE INDEX idx_tdee_records_created_at ON tdee_records(created_at);

-- 插入預設專案
INSERT INTO projects (project_key, project_name, description) VALUES
('bmi_calculator', 'BMI 計算器', '身體質量指數計算工具'),
('tdee_calculator', 'TDEE 計算器', '每日總能量消耗計算工具');

-- 建立更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 users 表建立更新時間觸發器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();