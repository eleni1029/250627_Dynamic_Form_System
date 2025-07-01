#!/bin/bash

echo "🔧 修復用戶權限和專案鍵值問題"
echo "=============================="

# ===== 1. 創建 SQL 修復腳本 =====
echo "📝 創建 SQL 修復腳本..."

cat > backend/fix_permissions.sql << 'EOF'
-- ===== 修復專案鍵值和用戶權限 =====

-- 1. 更新專案鍵值以匹配前端期望
UPDATE projects SET project_key = 'bmi' WHERE project_key = 'bmi_calculator';
UPDATE projects SET project_key = 'tdee' WHERE project_key = 'tdee_calculator';

-- 2. 確保專案存在（如果上面的更新沒有找到記錄）
INSERT INTO projects (project_key, project_name, description, is_active) VALUES 
('bmi', 'BMI Calculator', 'Body Mass Index calculator', true),
('tdee', 'TDEE Calculator', 'Total Daily Energy Expenditure calculator', true)
ON CONFLICT (project_key) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 3. 為所有現有用戶分配 BMI 和 TDEE 權限
DO $$
DECLARE
    user_record RECORD;
    bmi_project_id UUID;
    tdee_project_id UUID;
BEGIN
    -- 獲取專案 ID
    SELECT id INTO bmi_project_id FROM projects WHERE project_key = 'bmi';
    SELECT id INTO tdee_project_id FROM projects WHERE project_key = 'tdee';
    
    -- 為每個活躍用戶分配權限
    FOR user_record IN SELECT id, username FROM users WHERE is_active = true LOOP
        -- 分配 BMI 權限
        IF bmi_project_id IS NOT NULL THEN
            INSERT INTO user_project_permissions (user_id, project_id, granted_by)
            VALUES (user_record.id, bmi_project_id, 'system')
            ON CONFLICT (user_id, project_id) DO NOTHING;
            
            RAISE NOTICE 'Granted BMI permission to user: %', user_record.username;
        END IF;
        
        -- 分配 TDEE 權限
        IF tdee_project_id IS NOT NULL THEN
            INSERT INTO user_project_permissions (user_id, project_id, granted_by)
            VALUES (user_record.id, tdee_project_id, 'system')
            ON CONFLICT (user_id, project_id) DO NOTHING;
            
            RAISE NOTICE 'Granted TDEE permission to user: %', user_record.username;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'User permissions setup completed';
END $$;

-- 4. 驗證結果
SELECT 
    u.username,
    u.name,
    p.project_key,
    p.project_name,
    upp.granted_at
FROM user_project_permissions upp
JOIN users u ON upp.user_id = u.id
JOIN projects p ON upp.project_id = p.id
WHERE u.is_active = true
ORDER BY u.username, p.project_key;
EOF

# ===== 2. 執行 SQL 修復 =====
echo "🗄️  執行資料庫修復..."

# 檢查 PostgreSQL 連接
if ! nc -z localhost 5432 2>/dev/null; then
    echo "❌ PostgreSQL 未運行，請先啟動資料庫"
    exit 1
fi

# 執行 SQL 腳本
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -f backend/fix_permissions.sql

if [ $? -eq 0 ]; then
    echo "✅ 資料庫修復成功"
else
    echo "❌ 資料庫修復失敗"
    exit 1
fi

# ===== 3. 驗證修復結果 =====
echo "🔍 驗證修復結果..."

echo "--- 專案列表 ---"
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -c "SELECT project_key, project_name, is_active FROM projects ORDER BY project_key;"

echo ""
echo "--- 用戶權限 ---"
psql postgresql://postgres:postgres123@localhost:5432/dynamic_form_system -c "
SELECT 
    u.username,
    p.project_key,
    upp.granted_at
FROM user_project_permissions upp
JOIN users u ON upp.user_id = u.id
JOIN projects p ON upp.project_id = p.id
WHERE u.is_active = true
ORDER BY u.username, p.project_key;
"

# ===== 4. 清理臨時文件 =====
rm -f backend/fix_permissions.sql

echo ""
echo "🎉 權限修復完成！"
echo ""
echo "🚀 現在可以測試："
echo "1. 重新整理前端頁面"
echo "2. 使用以下帳號登錄測試："
echo "   - testuser / password123"
echo "   - demo / password123"
echo "3. 檢查是否能看到 BMI 和 TDEE 專案"