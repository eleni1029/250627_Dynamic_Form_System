-- ===== 完整的專案模組種子數據 =====
-- backend/src/database/seeds/projects.seed.sql

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

-- 創建示範用戶（如果不存在）  
INSERT INTO users (username, password_hash, name, is_active) VALUES 
('demo', '$2b$12$LQv3c1yqBwEHxPiEQ9Z9gOJmcZrB1lF4j8VzGy3nKgzR7cK2mJ8Vy', 'Demo User', true)
ON CONFLICT (username) DO NOTHING;

-- 為測試用戶和示範用戶分配專案權限
DO $$
DECLARE
    test_user_id UUID;
    demo_user_id UUID;
    bmi_project_id UUID;
    tdee_project_id UUID;
BEGIN
    -- 獲取用戶 ID
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
    SELECT id INTO demo_user_id FROM users WHERE username = 'demo';
    
    -- 獲取專案 ID
    SELECT id INTO bmi_project_id FROM projects WHERE project_key = 'bmi';
    SELECT id INTO tdee_project_id FROM projects WHERE project_key = 'tdee';
    
    -- 為測試用戶分配權限
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
    
    -- 為示範用戶分配權限
    IF demo_user_id IS NOT NULL AND bmi_project_id IS NOT NULL THEN
        INSERT INTO user_project_permissions (user_id, project_id) 
        VALUES (demo_user_id, bmi_project_id)
        ON CONFLICT (user_id, project_id) DO NOTHING;
    END IF;
    
    IF demo_user_id IS NOT NULL AND tdee_project_id IS NOT NULL THEN
        INSERT INTO user_project_permissions (user_id, project_id) 
        VALUES (demo_user_id, tdee_project_id)
        ON CONFLICT (user_id, project_id) DO NOTHING;
    END IF;
END $$;

-- 插入一些示範的 BMI 記錄（用於測試）
DO $$
DECLARE
    test_user_id UUID;
    demo_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
    SELECT id INTO demo_user_id FROM users WHERE username = 'demo';
    
    -- 為測試用戶插入 BMI 記錄
    IF test_user_id IS NOT NULL THEN
        INSERT INTO bmi_records (user_id, height, weight, age, gender, created_at) VALUES 
        (test_user_id, 175, 70, 30, 'male', NOW() - INTERVAL '7 days'),
        (test_user_id, 175, 68, 30, 'male', NOW() - INTERVAL '3 days'),
        (test_user_id, 175, 72, 30, 'male', NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, created_at) VALUES 
        (test_user_id, 175, 70, 30, 'male', 'moderate', NOW() - INTERVAL '5 days'),
        (test_user_id, 175, 68, 30, 'male', 'active', NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- 為示範用戶插入一些不同的測試數據
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO bmi_records (user_id, height, weight, age, gender, created_at) VALUES 
        (demo_user_id, 160, 55, 25, 'female', NOW() - INTERVAL '10 days'),
        (demo_user_id, 160, 57, 25, 'female', NOW() - INTERVAL '5 days')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, created_at) VALUES 
        (demo_user_id, 160, 55, 25, 'female', 'light', NOW() - INTERVAL '8 days'),
        (demo_user_id, 160, 57, 25, 'female', 'moderate', NOW() - INTERVAL '4 days')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 插入更多多樣化的測試數據
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
    
    IF test_user_id IS NOT NULL THEN
        -- 插入不同體型的 BMI 測試數據
        INSERT INTO bmi_records (user_id, height, weight, age, gender, created_at) VALUES 
        (test_user_id, 165, 50, 22, 'female', NOW() - INTERVAL '15 days'),  -- 體重過輕
        (test_user_id, 180, 85, 35, 'male', NOW() - INTERVAL '12 days'),    -- 超重
        (test_user_id, 170, 95, 40, 'male', NOW() - INTERVAL '9 days'),     -- 肥胖
        (test_user_id, 155, 52, 28, 'female', NOW() - INTERVAL '6 days')    -- 正常
        ON CONFLICT DO NOTHING;
        
        -- 插入不同活動等級的 TDEE 測試數據
        INSERT INTO tdee_records (user_id, height, weight, age, gender, activity_level, created_at) VALUES 
        (test_user_id, 165, 50, 22, 'female', 'sedentary', NOW() - INTERVAL '14 days'),
        (test_user_id, 180, 85, 35, 'male', 'very_active', NOW() - INTERVAL '11 days'),
        (test_user_id, 170, 65, 28, 'female', 'light', NOW() - INTERVAL '7 days'),
        (test_user_id, 175, 80, 45, 'male', 'active', NOW() - INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 記錄系統初始化活動
INSERT INTO activity_logs (action_type, action_description, created_at) VALUES 
('SYSTEM_INIT', 'Project modules initialized with comprehensive seed data', NOW()),
('DATA_SEED', 'Test users and sample calculation records created', NOW())
ON CONFLICT DO NOTHING;

-- 更新統計信息（可選）
DO $$
DECLARE
    bmi_count INTEGER;
    tdee_count INTEGER;
    users_count INTEGER;
    projects_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bmi_count FROM bmi_records;
    SELECT COUNT(*) INTO tdee_count FROM tdee_records;
    SELECT COUNT(*) INTO users_count FROM users WHERE is_active = true;
    SELECT COUNT(*) INTO projects_count FROM projects WHERE is_active = true;
    
    INSERT INTO activity_logs (action_type, action_description, created_at) VALUES 
    ('STATS_UPDATE', 
     format('Seed completed: %s users, %s projects, %s BMI records, %s TDEE records', 
            users_count, projects_count, bmi_count, tdee_count), 
     NOW())
    ON CONFLICT DO NOTHING;
END $$;